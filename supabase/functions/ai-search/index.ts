import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const systemPrompt = `Du är en expert på att tolka svenska fritextfrågor om testpersoner och översätta dem till strukturerade sökfilter.

Databasen har dessa sökbara fält (vy: kp_v_person_directory):
- pnr (text): Personnummer (12 siffror, t.ex. 199301052388)
- first_name (text): Förnamn
- middle_name (text): Mellannamn
- last_name (text): Efternamn
- gender (text): Kön - "M" för man, "K" för kvinna
- municipality (text): Kommun (t.ex. "Stockholm", "Nacka", "Solna")
- county (text): Län (t.ex. "Stockholms län")
- fb_postnr (text): Postnummer
- fb_postort (text): Postort (t.ex. "STOCKHOLM", "SOLNA")
- fb_address1 (text): Adress rad 1
- fb_address2 (text): Adress rad 2
- booked_to_region_stockholm (boolean): Bokad till Region Stockholm
- belongs_to_region_stockholm (boolean): Tillhör Region Stockholm
- hsaid (text): HSA-ID (t.ex. AMRS, AQWW)

Relationsdata finns i separat tabell (kp_person_relationships) med dessa relationstyper (rel_typ):
- "M" = Make/Maka (gift med)
- "B" = Barn
- "MO" = Mor
- "FA" = Far
- "VF" = Vårdnadshavare Far
- "V" = Vårdnadshavare
- "P" = Partner

Svara med JSON:
{
  "filters": { ... },
  "reasoning": "Kort motivering på svenska"
}

Filters kan innehålla:
- "pnr": exakt match
- "first_name": ILIKE-mönster
- "last_name": ILIKE-mönster
- "name_search": delvis namnmatchning
- "gender": "M" eller "K"
- "municipality": ILIKE (t.ex. "Stockholm")
- "county": ILIKE (t.ex. "Stockholms län")
- "fb_postnr": exakt
- "fb_postort": ILIKE
- "booked_to_region_stockholm": boolean
- "belongs_to_region_stockholm": boolean
- "hsaid": ILIKE eller exakt
- "has_hsaid": boolean (om personen har HSA-ID)
- "has_relation": array av relationstyper som personen MÅSTE ha, t.ex. ["M"] för gift, ["B"] för har barn, ["M","B"] för gift med barn
- "not_has_relation": array av relationstyper personen INTE ska ha

VIKTIGT:
- "gift" eller "gifta" → has_relation: ["M"]
- "med barn" eller "har barn" → has_relation: ["B"]  
- "gift med barn" → has_relation: ["M", "B"]
- "ogift" → not_has_relation: ["M"]
- "bosatt i stockholm" → municipality: "Stockholm" (kommun) ELLER fb_postort: "STOCKHOLM" — använd municipality som primärt filter
- Inkludera BARA relevanta filter.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_persons",
              description: "Search for test persons based on parsed filters",
              parameters: {
                type: "object",
                properties: {
                  filters: {
                    type: "object",
                    properties: {
                      pnr: { type: "string" },
                      first_name: { type: "string" },
                      last_name: { type: "string" },
                      name_search: { type: "string" },
                      gender: { type: "string", enum: ["M", "K"] },
                      municipality: { type: "string" },
                      county: { type: "string" },
                      fb_postnr: { type: "string" },
                      fb_postort: { type: "string" },
                      booked_to_region_stockholm: { type: "boolean" },
                      belongs_to_region_stockholm: { type: "boolean" },
                      hsaid: { type: "string" },
                      has_hsaid: { type: "boolean" },
                      has_relation: { type: "array", items: { type: "string", enum: ["M", "B", "MO", "FA", "VF", "V", "P"] } },
                      not_has_relation: { type: "array", items: { type: "string", enum: ["M", "B", "MO", "FA", "VF", "V", "P"] } },
                    },
                    additionalProperties: false,
                  },
                  reasoning: { type: "string" },
                },
                required: ["filters", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "search_persons" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Söktjänsten är tillfälligt överbelastad." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const { filters, reasoning } = parsed;

    console.log("AI filters:", JSON.stringify(filters));

    const supabase = createClient(supabaseUrl, supabaseKey);

    // If relation filters are used, first find PNRs that match relation criteria
    let relationFilteredPnrs: string[] | null = null;

    if (filters.has_relation && Array.isArray(filters.has_relation) && filters.has_relation.length > 0) {
      // For each required relation type, find persons (person_a) that have that relation
      const pnrSets: Set<string>[] = [];
      for (const relType of filters.has_relation) {
        const { data: rels, error: relError } = await supabase
          .from("kp_person_relationships")
          .select("person_a")
          .eq("rel_typ", relType);
        if (relError) {
          console.error("Relation query error:", relError);
          continue;
        }
        const pnrs = new Set((rels || []).map((r: { person_a: string }) => r.person_a));
        pnrSets.push(pnrs);
      }
      // Intersect all sets
      if (pnrSets.length > 0) {
        relationFilteredPnrs = [...pnrSets[0]].filter(pnr => 
          pnrSets.every(set => set.has(pnr))
        );
      }
    }

    if (filters.not_has_relation && Array.isArray(filters.not_has_relation) && filters.not_has_relation.length > 0) {
      const excludePnrs = new Set<string>();
      for (const relType of filters.not_has_relation) {
        const { data: rels } = await supabase
          .from("kp_person_relationships")
          .select("person_a")
          .eq("rel_typ", relType);
        (rels || []).forEach((r: { person_a: string }) => excludePnrs.add(r.person_a));
      }
      if (relationFilteredPnrs) {
        relationFilteredPnrs = relationFilteredPnrs.filter(pnr => !excludePnrs.has(pnr));
      } else {
        // Need to get all PNRs and exclude
        const { data: allPersons } = await supabase
          .from("kp_v_person_directory")
          .select("pnr");
        relationFilteredPnrs = (allPersons || [])
          .map((p: { pnr: string }) => p.pnr)
          .filter((pnr: string) => !excludePnrs.has(pnr));
      }
    }

    // If relation filter returned no matches, return empty
    if (relationFilteredPnrs !== null && relationFilteredPnrs.length === 0) {
      return new Response(
        JSON.stringify({ persons: [], filters, reasoning, total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let dbQuery = supabase
      .from("kp_v_person_directory")
      .select("*")
      .limit(50);

    // Apply relation PNR filter
    if (relationFilteredPnrs !== null) {
      // Supabase .in() has limits, take first 500 to be safe
      dbQuery = dbQuery.in("pnr", relationFilteredPnrs.slice(0, 500));
    }

    if (filters.pnr) dbQuery = dbQuery.eq("pnr", filters.pnr);
    if (filters.first_name) dbQuery = dbQuery.ilike("first_name", `%${filters.first_name}%`);
    if (filters.last_name) dbQuery = dbQuery.ilike("last_name", `%${filters.last_name}%`);
    if (filters.name_search) {
      dbQuery = dbQuery.or(`first_name.ilike.%${filters.name_search}%,last_name.ilike.%${filters.name_search}%,middle_name.ilike.%${filters.name_search}%`);
    }
    if (filters.gender) dbQuery = dbQuery.eq("gender", filters.gender);
    if (filters.municipality) dbQuery = dbQuery.ilike("municipality", `%${filters.municipality}%`);
    if (filters.county) dbQuery = dbQuery.ilike("county", `%${filters.county}%`);
    if (filters.fb_postnr) dbQuery = dbQuery.eq("fb_postnr", filters.fb_postnr);
    if (filters.fb_postort) dbQuery = dbQuery.ilike("fb_postort", `%${filters.fb_postort}%`);
    if (filters.booked_to_region_stockholm !== undefined) {
      dbQuery = dbQuery.eq("booked_to_region_stockholm", filters.booked_to_region_stockholm);
    }
    if (filters.belongs_to_region_stockholm !== undefined) {
      dbQuery = dbQuery.eq("belongs_to_region_stockholm", filters.belongs_to_region_stockholm);
    }
    if (filters.hsaid) dbQuery = dbQuery.ilike("hsaid", `%${filters.hsaid}%`);
    if (filters.has_hsaid === true) dbQuery = dbQuery.not("hsaid", "is", null);
    if (filters.has_hsaid === false) dbQuery = dbQuery.is("hsaid", null);

    const { data: persons, error: dbError } = await dbQuery;
    if (dbError) throw new Error(`DB error: ${dbError.message}`);

    return new Response(
      JSON.stringify({ persons: persons || [], filters, reasoning, total: persons?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Okänt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
