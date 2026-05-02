import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// =============================================================
// Hjälpare
// =============================================================

function cell(row: any[], idx: number): string | null {
  const v = row[idx];
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// Person: 67 fält (kolumnindex 0–66) i exakt samma ordning som tabellen
const PERSON_FIELDS = [
  "pnr",
  "pnr_typ",
  "tilltalskod",
  "fnamn",
  "mnamn",
  "enamn",
  "fnamn_styrkt",
  "mnamn_styrkt",
  "enamn_styrkt",
  "lan",
  "kommun",
  "fors",
  "fb_co_adr",
  "fb_utdel_adr1",
  "fb_utdel_adr2",
  "fb_postnr",
  "fb_postort",
  "avr_orsak",
  "avr_datum",
  "fb_datum",
  "avi_namn",
  "fast_beteckning",
  "fb_avi_utdel_adr",
  "fb_avi_postnr",
  "fb_avi_postort",
  "sp_co_adr",
  "sp_utdel_adr1",
  "sp_utdel_adr2",
  "sp_postnr",
  "sp_postort",
  "sp_avi_utdel_adr",
  "sp_avi_postnr",
  "sp_avi_postort",
  "utl_co_adr",
  "utl_utdel_adr1",
  "utl_utdel_adr2",
  "utl_land",
  "utl_datum",
  "civ",
  "civ_datum",
  "fod_lan",
  "fod_fors",
  "fod_ort",
  "fod_ort_styrkt",
  "fod_land",
  "inv_datum",
  "icke_terr_fors",
  "kon",
  "eff_datum",
  "hanv_pnr",
  "sekr_mark",
  "created_by",
  "created_time",
  "updated_by",
  "updated_time",
  "distriktskod",
  "skyddad_fb",
  "fod_datum",
  "identity_level",
  "identity_level_date",
  "fiktivt_nr",
  "utl_datum_rostratt",
  "antraffad_dod",
  "uppehallsratt",
  "opt_out_pappersavisering",
  "version",
  "revision",
] as const;

interface ParseResult {
  person: Map<string, Record<string, unknown>>;
  contact_info: Map<string, Record<string, unknown>>;
  fb_relation: Map<string, Record<string, unknown>>;
  afb_relation: Map<string, Record<string, unknown>>;
  fastighet_adress: Map<string, Record<string, unknown>>;
  contact_person: Map<string, Record<string, unknown>>;
  actor_organization: Map<string, Record<string, unknown>>;
  notification_sync: Map<string, Record<string, unknown>>;
  totalRows: number;
}

function parseWorkbook(rows: any[][]): ParseResult {
  const person = new Map<string, Record<string, unknown>>();
  const contact_info = new Map<string, Record<string, unknown>>();
  const fb_relation = new Map<string, Record<string, unknown>>();
  const afb_relation = new Map<string, Record<string, unknown>>();
  const fastighet_adress = new Map<string, Record<string, unknown>>();
  const contact_person = new Map<string, Record<string, unknown>>();
  const actor_organization = new Map<string, Record<string, unknown>>();
  const notification_sync = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    // ---- Person (alltid) ----
    const pnr = cell(row, 0);
    if (!pnr) continue; // hoppa över rader utan pnr
    if (!person.has(pnr)) {
      const obj: Record<string, unknown> = {};
      PERSON_FIELDS.forEach((field, i) => {
        obj[field] = cell(row, i);
      });
      person.set(pnr, obj);
    }

    // ---- contact_info (index 67–70) — om Pnr.1 inte är NULL ----
    if (cell(row, 67) !== null) {
      const id = cell(row, 68);
      if (id && !contact_info.has(id)) {
        contact_info.set(id, {
          contact_info_id: id,
          pnr: cell(row, 67),
          last_updated_stamp: cell(row, 69),
          created_stamp: cell(row, 70),
        });
      }
    }

    // ---- fb_relation (index 71–82) — kräver Pnr.2 OCH RelTyp ----
    {
      const fbPnr = cell(row, 71);
      const relTyp = cell(row, 73);
      if (fbPnr !== null && relTyp !== null) {
        const vardDatum = cell(row, 74);
        const key = `${pnr}|${fbPnr}|${relTyp}|${vardDatum ?? ""}`;
        if (!fb_relation.has(key)) {
          fb_relation.set(key, {
            pnr: cell(row, 71),
            // index 72 är "PnrRel" / second pnr-kolumn enligt blockets layout —
            // här används index 71 som fb_rel_pnr enligt promptens fält­ordning
            fb_rel_pnr: cell(row, 72),
            rel_typ: relTyp,
            vard_datum: vardDatum,
            vard_slut_datum: cell(row, 75),
            rel_avr_orsak: cell(row, 76),
            rel_avr_datum: cell(row, 77),
            created_by: cell(row, 78),
            created_time: cell(row, 79),
            updated_by: cell(row, 80),
            updated_time: cell(row, 81),
            status: cell(row, 82),
          });
        }
      }
    }

    // ---- afb_relation (index 83–97) — kräver Pnr.3 OCH RelTyp.1 ----
    {
      const afbStart = cell(row, 83);
      const relTyp = cell(row, 85);
      if (afbStart !== null && relTyp !== null) {
        const fodtid = cell(row, 84);
        const fnamn = cell(row, 89);
        const enamn = cell(row, 91);
        const vardDatum = cell(row, 86);
        const key = `${pnr}|${fodtid ?? ""}|${relTyp}|${fnamn ?? ""}|${enamn ?? ""}|${vardDatum ?? ""}`;
        if (!afb_relation.has(key)) {
          afb_relation.set(key, {
            pnr: cell(row, 83),
            afb_rel_fodtid: fodtid,
            rel_typ: relTyp,
            vard_datum: vardDatum,
            vard_slut_datum: cell(row, 87),
            // 88 = mellan-kolumn enligt blocket (orsak före namn varierar)
            afb_rel_fnamn: cell(row, 89),
            afb_rel_mnamn: cell(row, 90),
            afb_rel_enamn: cell(row, 91),
            rel_avr_orsak: cell(row, 92),
            rel_avr_datum: cell(row, 93),
            created_by: cell(row, 94),
            created_time: cell(row, 95),
            updated_by: cell(row, 96),
            updated_time: cell(row, 97),
            status: null,
          });
        }
      }
    }

    // index 98–106 = Pnr.4-blocket (tomt, hoppa över)

    // ---- fastighet_adress (index 107–114) — kräver Pnr.5 ----
    {
      const fPnr = cell(row, 107);
      if (fPnr !== null) {
        const fastighet = cell(row, 108);
        const adress = cell(row, 109);
        const lagenhet = cell(row, 110);
        const key = `${pnr}|${fastighet ?? ""}|${adress ?? ""}|${lagenhet ?? ""}`;
        if (!fastighet_adress.has(key)) {
          fastighet_adress.set(key, {
            pnr: fPnr,
            fastighet,
            adress,
            lagenhet,
            created_by: cell(row, 111),
            created_time: cell(row, 112),
            updated_by: cell(row, 113),
            updated_time: cell(row, 114),
          });
        }
      }
    }

    // ---- contact_person (index 115–127) — kräver ContactPersonID ----
    {
      const cpId = cell(row, 115);
      if (cpId !== null && !contact_person.has(cpId)) {
        contact_person.set(cpId, {
          contact_person_id: cpId,
          pnr,
          contact_relationship_type: cell(row, 116),
          priority_order: cell(row, 117),
          given_name: cell(row, 118),
          surname: cell(row, 119),
          middle_name: cell(row, 120),
          actor_id: cell(row, 121),
          organization_id: cell(row, 122),
          updated_date: cell(row, 123),
          main_contact_address_id: cell(row, 124),
          last_updated_stamp: cell(row, 125),
          created_stamp: cell(row, 126),
          // 127 = extra kolumn i blocket – ignoreras (ingen kolumn i schemat)
        });
      }
    }

    // index 128–134 = Pnr.7-blocket (tomt, hoppa över)

    // ---- actor_organization (index 135–140) — kräver Pnr.8 ----
    {
      const aoPnr = cell(row, 135);
      if (aoPnr !== null) {
        const actorId = cell(row, 136);
        const orgId = cell(row, 137);
        const key = `${pnr}|${actorId ?? ""}|${orgId ?? ""}`;
        if (!actor_organization.has(key)) {
          actor_organization.set(key, {
            pnr: aoPnr,
            actor_id: actorId,
            organization_id: orgId,
            updated_date: cell(row, 138),
            last_updated_stamp: cell(row, 139),
            created_stamp: cell(row, 140),
          });
        }
      }
    }

    // ---- notification_sync (index 141–151) — kräver Pnr.9 ----
    {
      const nsPnr = cell(row, 141);
      if (nsPnr !== null) {
        const syncTime = cell(row, 142);
        const notifDate = cell(row, 147);
        const key = `${pnr}|${syncTime ?? ""}|${notifDate ?? ""}`;
        if (!notification_sync.has(key)) {
          notification_sync.set(key, {
            pnr: nsPnr,
            syncronization_time: syncTime,
            record_id: cell(row, 143),
            notification_type: cell(row, 144),
            modification_time: cell(row, 145),
            total_record: cell(row, 146),
            notification_date: notifDate,
            created_by: cell(row, 148),
            created_time: cell(row, 149),
            updated_by: cell(row, 150),
            updated_time: cell(row, 151),
          });
        }
      }
    }

    // index 152–161 = Pnr.10-blocket (tomt, hoppa över)
  }

  return {
    person,
    contact_info,
    fb_relation,
    afb_relation,
    fastighet_adress,
    contact_person,
    actor_organization,
    notification_sync,
    totalRows: rows.length,
  };
}

// Steg som visas för användaren
type StepKey =
  | "idle"
  | "parsing"
  | "dedupe"
  | "reset"
  | "person"
  | "contact_info"
  | "fb_relation"
  | "afb_relation"
  | "fastighet_adress"
  | "contact_person"
  | "actor_organization"
  | "notification_sync"
  | "done"
  | "error";

const STEP_LABELS: Record<StepKey, string> = {
  idle: "Väntar",
  parsing: "Läser Excel-filen…",
  dedupe: "Dedupliserar rader i minnet…",
  reset: "Tömmer befintliga tabeller…",
  person: "Skickar person…",
  contact_info: "Skickar contact_info…",
  fb_relation: "Skickar fb_relation…",
  afb_relation: "Skickar afb_relation…",
  fastighet_adress: "Skickar fastighet_adress…",
  contact_person: "Skickar contact_person…",
  actor_organization: "Skickar actor_organization…",
  notification_sync: "Skickar notification_sync…",
  done: "Klart",
  error: "Fel",
};

const TABLE_ORDER: StepKey[] = [
  "person",
  "contact_info",
  "fb_relation",
  "afb_relation",
  "fastighet_adress",
  "contact_person",
  "actor_organization",
  "notification_sync",
];

const CHUNK_SIZE = 500;

// =============================================================
// Komponenten
// =============================================================
export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<StepKey>("idle");
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setErrorMsg(null);
    setCounts(null);
    setStep("idle");
    setProgress(0);
  };

  const callFn = async (payload: unknown) => {
    const { data, error } = await supabase.functions.invoke(
      "import-folkbokforing",
      { body: payload }
    );
    if (error) throw new Error(error.message ?? "Anrop till importfunktion misslyckades");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const runImport = async () => {
    if (!file) return;
    setRunning(true);
    setErrorMsg(null);
    setCounts(null);
    setProgress(0);

    try {
      // Steg 1: parse
      setStep("parsing");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        raw: false,
        defval: null,
        blankrows: false,
      });

      if (rows.length < 2) {
        throw new Error("Filen innehåller inga datarader.");
      }
      const headerRow = rows[0];
      if (!Array.isArray(headerRow) || headerRow.length < 152) {
        throw new Error(
          `Ogiltig fil: header har ${headerRow?.length ?? 0} kolumner, minst 152 krävs.`
        );
      }
      const dataRows = rows.slice(1);

      // Validera att 90% av raderna har pnr
      const withPnr = dataRows.filter((r) => cell(r, 0) !== null).length;
      if (withPnr / dataRows.length < 0.9) {
        throw new Error(
          `Ogiltig fil: endast ${Math.round((withPnr / dataRows.length) * 100)}% av raderna har Pnr (kolumn 0). Minst 90% krävs.`
        );
      }

      // Steg 2: dedupe
      setStep("dedupe");
      await new Promise((r) => setTimeout(r, 0)); // släpp UI-tråden
      const parsed = parseWorkbook(dataRows);

      // Steg 3: reset
      setStep("reset");
      await callFn({ action: "reset" });

      // Steg 4: insert per tabell
      const totals: Record<string, number> = {};
      let totalToSend = 0;
      for (const t of TABLE_ORDER) {
        totalToSend += (parsed as any)[t].size;
      }
      let sent = 0;

      // Giltiga personnummer (det vi precis lagt i person-tabellen).
      // Alla underordnade tabeller har FK pnr -> person(pnr), så vi måste
      // filtrera bort barn-rader vars pnr saknas i person-setet (eller är null).
      const validPnrs: Set<string> = new Set(parsed.person.keys());
      const skipped: Record<string, number> = {};

      for (const table of TABLE_ORDER) {
        setStep(table);
        const map: Map<string, Record<string, unknown>> = (parsed as any)[table];
        let rowsArr = Array.from(map.values());

        if (table !== "person") {
          const before = rowsArr.length;
          rowsArr = rowsArr.filter((r) => {
            const p = r.pnr;
            return typeof p === "string" && p.length > 0 && validPnrs.has(p);
          });
          const dropped = before - rowsArr.length;
          if (dropped > 0) {
            skipped[table] = dropped;
            console.warn(
              `[import] ${table}: hoppade över ${dropped} rader vars pnr saknas i person-tabellen eller var null.`
            );
          }
        }

        totals[table] = rowsArr.length;

        for (let i = 0; i < rowsArr.length; i += CHUNK_SIZE) {
          const chunk = rowsArr.slice(i, i + CHUNK_SIZE);
          await callFn({ action: "insert", table, rows: chunk });
          sent += chunk.length;
          setProgress(Math.min(100, Math.round((sent / Math.max(1, totalToSend)) * 100)));
        }
      }

      if (Object.keys(skipped).length > 0) {
        console.warn("[import] Översikt över skippade rader:", skipped);
      }

      // Hämta riktiga counts från servern
      const countResp = await callFn({ action: "count" });
      setCounts(countResp?.counts ?? totals);
      setStep("done");
      setProgress(100);
      toast({
        title: "Import klar",
        description: `${(countResp?.counts?.person ?? totals.person ?? 0)} personer importerade.`,
      });
    } catch (e: any) {
      setStep("error");
      setErrorMsg(e?.message ?? String(e));
      toast({
        title: "Import misslyckades",
        description: e?.message ?? "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importera testdata</h1>
        <p className="text-muted-foreground mt-1">
          Ladda upp <span className="font-mono">AllaPnrMedJoinKundtest2.xlsx</span> (eller
          motsvarande). Filen normaliseras till 8 tabeller och tidigare import skrivs över.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Excel-fil
          </CardTitle>
          <CardDescription>
            Endast .xlsx accepteras. Filen processas i webbläsaren och skickas i batchar
            (~500 rader åt gången) till backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={running}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
            />
            <Button
              onClick={runImport}
              disabled={!file || running}
              className="gap-2 shrink-0"
            >
              <Upload className="h-4 w-4" />
              {running ? "Importerar…" : "Importera"}
            </Button>
          </div>

          {file && !running && step === "idle" && (
            <p className="text-sm text-muted-foreground">
              Vald fil: <span className="font-mono">{file.name}</span>{" "}
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}

          {(running || step === "done" || step === "error") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{STEP_LABELS[step]}</span>
                <span className="text-muted-foreground tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importen misslyckades</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          {counts && step === "done" && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Import klar</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>{counts.person ?? 0} personer</li>
                  <li>{counts.contact_info ?? 0} kontaktinfo-rader</li>
                  <li>{counts.fb_relation ?? 0} folkbokföringsrelationer</li>
                  <li>{counts.afb_relation ?? 0} utlandsrelationer</li>
                  <li>{counts.fastighet_adress ?? 0} fastighetsrader</li>
                  <li>{counts.contact_person ?? 0} kontaktpersoner</li>
                  <li>{counts.actor_organization ?? 0} actor/organization</li>
                  <li>{counts.notification_sync ?? 0} notifikationssynk</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
