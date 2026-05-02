// Edge function: import-folkbokforing
// Tar emot redan normaliserade JSON-batchar från klienten och skriver
// till de 8 nya tabellerna. Stödjer också "reset" som tömmer tabellerna.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TABLES = new Set([
  "person",
  "contact_info",
  "fb_relation",
  "afb_relation",
  "fastighet_adress",
  "contact_person",
  "actor_organization",
  "notification_sync",
]);

interface InsertPayload {
  action: "insert";
  table: string;
  rows: Record<string, unknown>[];
}

interface ResetPayload {
  action: "reset";
}

interface CountPayload {
  action: "count";
}

type Payload = InsertPayload | ResetPayload | CountPayload;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    if (body.action === "reset") {
      const { error } = await supabase.rpc("reset_import_tables");
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === "count") {
      const counts: Record<string, number> = {};
      for (const t of ALLOWED_TABLES) {
        const { count, error } = await supabase
          .from(t)
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        counts[t] = count ?? 0;
      }
      return json({ ok: true, counts });
    }

    if (body.action === "insert") {
      const { table, rows } = body;
      if (!ALLOWED_TABLES.has(table)) {
        return json({ error: `Otillåten tabell: ${table}` }, 400);
      }
      if (!Array.isArray(rows) || rows.length === 0) {
        return json({ ok: true, inserted: 0 });
      }
      // Batch-insert i chunks om 500 rader
      const CHUNK = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const { error } = await supabase.from(table).insert(chunk);
        if (error) {
          return json(
            {
              error: `Insert misslyckades i ${table} (rad ${i}–${i + chunk.length}): ${error.message}`,
              details: error.details,
              hint: error.hint,
            },
            500
          );
        }
        inserted += chunk.length;
      }
      return json({ ok: true, table, inserted });
    }

    return json({ error: "Okänd action" }, 400);
  } catch (e: any) {
    return json(
      { error: e?.message ?? "Okänt serverfel", stack: e?.stack ?? null },
      500
    );
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
