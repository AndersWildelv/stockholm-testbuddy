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

    // Step 1: Use AI to parse the Swedish prompt into structured filters
    const systemPrompt = `Du är en expert på att tolka svenska fritextfrågor om testpersoner och översätta dem till strukturerade sökfilter.

Databasen har dessa sökbara fält:
- first_name (text): Förnamn
- last_name (text): Efternamn  
- middle_name (text): Mellannamn
- personnummer (text): Personnummer (format: YYYYMMDDNNNN)
- gender (text): Kön - "M" för man, "K" för kvinna
- birth_date (date): Födelsedatum (YYYY-MM-DD)
- city (text): Postort (t.ex. STOCKHOLM, NACKA, SALTSJÖ-BOO, EKERÖ, SOLNA, STENHAMRA, SALTSJÖBADEN, ADELSÖ)
- postal_code (text): Postnummer
- county_code (text): Länskod (t.ex. "1" för Stockholm)
- municipality_code (text): Kommunkod (t.ex. "80" för Stockholm stad, "82" för Nacka, "25" för Ekerö, "84" för Solna)
- civil_status (text): Civilstånd - "OG" ogift, "G" gift, "S" skild, "Ä" änka/änkling
- birth_country (text): Födelseland (t.ex. ARGENTINA, STORBRITANNIEN, ITALIEN, USA, KANADA, SCHWEIZ, SPANIEN, BELGIEN, PORTUGAL, GREKLAND, FRANKRIKE, TYSKLAND, POLEN, IRAN, IRAK, IRLAND, ALBANIEN)
- protected_identity (boolean): Skyddad identitet / sekretessmarkering
- person_type (text): "Personal" (har HSA-id) eller "Invånare" (saknar HSA-id)
- is_static (boolean): Statisk (skrivskyddad) eller dynamisk person
- pnr_type (text): Personnummertyp - "P" vanligt personnummer
- is_fictitious (boolean): Fiktivt nummer
- address (text): Utdelningsadress
- additional_attributes->>'AvrOrsak' (text): Avregistreringsorsak ("AV" = avregistrerad, "UV" = utvandrad)
- additional_attributes->>'FodLand' (text): Födelseland (samma som birth_country)
- additional_attributes->>'UtlLand' (text): Utlandsadress land
- additional_attributes->>'FodOrt' (text): Födelseort

Åldersberäkning: Använd birth_date relativt till CURRENT_DATE.
- Barn: 0-17 år
- Ungdom: 13-17 år  
- Vuxen: 18-64 år
- Äldre: 65+ år

Svara ALLTID med ett JSON-objekt med exakt detta format:
{
  "filters": { ... },
  "reasoning": "Kort motivering på svenska för varför dessa filter valdes",
  "sql_conditions": ["WHERE-villkor som SQL-strängar"]
}

Filters-objektet kan innehålla:
- "first_name": exakt eller ILIKE-mönster
- "last_name": exakt eller ILIKE-mönster
- "personnummer": exakt match
- "gender": "M" eller "K"
- "min_age": nummer
- "max_age": nummer
- "birth_year": nummer
- "city": text (ILIKE)
- "municipality_code": text
- "county_code": text
- "civil_status": text
- "birth_country": text (ILIKE)
- "protected_identity": boolean
- "person_type": "Personal" eller "Invånare"
- "is_fictitious": boolean
- "has_foreign_address": boolean
- "deregistered": boolean
- "name_search": text (för delvis namnmatchning)

Inkludera BARA filter som är relevanta för frågan. Utelämna fält som inte nämns.`;

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
              description: "Search for test persons based on parsed filters from user query",
              parameters: {
                type: "object",
                properties: {
                  filters: {
                    type: "object",
                    properties: {
                      first_name: { type: "string" },
                      last_name: { type: "string" },
                      personnummer: { type: "string" },
                      gender: { type: "string", enum: ["M", "K"] },
                      min_age: { type: "number" },
                      max_age: { type: "number" },
                      birth_year: { type: "number" },
                      city: { type: "string" },
                      municipality_code: { type: "string" },
                      county_code: { type: "string" },
                      civil_status: { type: "string" },
                      birth_country: { type: "string" },
                      protected_identity: { type: "boolean" },
                      person_type: { type: "string", enum: ["Personal", "Invånare"] },
                      is_fictitious: { type: "boolean" },
                      has_foreign_address: { type: "boolean" },
                      deregistered: { type: "boolean" },
                      name_search: { type: "string" },
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
      const text = await aiResponse.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Söktjänsten är tillfälligt överbelastad. Försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut. Kontakta administratör." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const { filters, reasoning } = parsed;

    // Step 2: Build deterministic SQL query from filters
    const supabase = createClient(supabaseUrl, supabaseKey);
    let dbQuery = supabase
      .from("persons")
      .select("id, person_id, personnummer, first_name, last_name, middle_name, birth_date, gender, civil_status, birth_country, protected_identity, person_type, is_static, city, postal_code, address, county_code, municipality_code, pnr_type, is_fictitious, additional_attributes")
      .limit(50);

    if (filters.personnummer) {
      dbQuery = dbQuery.eq("personnummer", filters.personnummer);
    }
    if (filters.first_name) {
      dbQuery = dbQuery.ilike("first_name", `%${filters.first_name}%`);
    }
    if (filters.last_name) {
      dbQuery = dbQuery.ilike("last_name", `%${filters.last_name}%`);
    }
    if (filters.name_search) {
      dbQuery = dbQuery.or(`first_name.ilike.%${filters.name_search}%,last_name.ilike.%${filters.name_search}%,middle_name.ilike.%${filters.name_search}%`);
    }
    if (filters.gender) {
      dbQuery = dbQuery.eq("gender", filters.gender);
    }
    if (filters.city) {
      dbQuery = dbQuery.ilike("city", `%${filters.city}%`);
    }
    if (filters.municipality_code) {
      dbQuery = dbQuery.eq("municipality_code", filters.municipality_code);
    }
    if (filters.county_code) {
      dbQuery = dbQuery.eq("county_code", filters.county_code);
    }
    if (filters.civil_status) {
      dbQuery = dbQuery.ilike("civil_status", `${filters.civil_status}%`);
    }
    if (filters.birth_country) {
      dbQuery = dbQuery.ilike("birth_country", `%${filters.birth_country}%`);
    }
    if (filters.protected_identity !== undefined) {
      dbQuery = dbQuery.eq("protected_identity", filters.protected_identity);
    }
    if (filters.person_type) {
      dbQuery = dbQuery.eq("person_type", filters.person_type);
    }
    if (filters.is_fictitious !== undefined) {
      dbQuery = dbQuery.eq("is_fictitious", filters.is_fictitious);
    }
    if (filters.birth_year) {
      dbQuery = dbQuery
        .gte("birth_date", `${filters.birth_year}-01-01`)
        .lte("birth_date", `${filters.birth_year}-12-31`);
    }
    if (filters.min_age !== undefined) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - filters.min_age);
      dbQuery = dbQuery.lte("birth_date", maxBirthDate.toISOString().split("T")[0]);
    }
    if (filters.max_age !== undefined) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - filters.max_age - 1);
      dbQuery = dbQuery.gte("birth_date", minBirthDate.toISOString().split("T")[0]);
    }

    const { data: persons, error: dbError } = await dbQuery;
    if (dbError) throw new Error(`DB error: ${dbError.message}`);

    return new Response(
      JSON.stringify({
        persons: persons || [],
        filters,
        reasoning,
        total: persons?.length || 0,
      }),
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
