import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, X, CalendarPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingDialog } from "@/components/BookingDialog";

interface Person {
  pnr: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  municipality: string | null;
  county: string | null;
  fb_postnr: string | null;
  fb_postort: string | null;
  fb_address1: string | null;
  fb_address2: string | null;
  booked_to_region_stockholm: boolean;
  belongs_to_region_stockholm: boolean | null;
  hsaid: string | null;
  protected_identity: boolean;
}

type SortDir = "asc" | "desc" | null;
type SortKey = keyof Person;

const EXCLUDED_REL_TYPES = ["GR", "KO", "Granne", "Kollega", "granne", "kollega", "neighbor", "colleague"];

const COLUMNS: { key: SortKey; label: string; filterable?: "select" | "text"; options?: string[] }[] = [
  { key: "last_name", label: "Namn", filterable: "text" },
  { key: "pnr", label: "Personnummer", filterable: "text" },
  { key: "gender", label: "Kön", filterable: "select", options: ["M", "K"] },
  { key: "municipality", label: "Kommun", filterable: "text" },
  { key: "county", label: "Län", filterable: "text" },
  { key: "fb_postort", label: "Postort", filterable: "text" },
  { key: "fb_postnr", label: "Postnr", filterable: "text" },
  { key: "hsaid", label: "HSA-ID", filterable: "text" },
  { key: "belongs_to_region_stockholm" as SortKey, label: "Tillhör RS", filterable: "select", options: ["Ja", "Nej"] },
  { key: "works_rs" as SortKey, label: "Jobbar RS", filterable: "select", options: ["Ja", "Nej"] },
];

export default function PersonsPage() {
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("last_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [bookedPnrs, setBookedPnrs] = useState<Set<string>>(new Set());
  const [bookingPnr, setBookingPnr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: personData }, { data: bookingData }] = await Promise.all([
        supabase
          .from("kp_v_person_directory" as any)
          .select("*")
          .order("last_name"),
        supabase
          .from("bookings")
          .select("person_id")
          .eq("status", "active"),
      ]);
      setPersons((personData as any) ?? []);
      setBookedPnrs(new Set((bookingData ?? []).map((b: any) => b.person_id)));
      setLoading(false);
    }
    load();
  }, []);

  const refreshBookings = async () => {
    const { data } = await supabase.from("bookings").select("person_id").eq("status", "active");
    setBookedPnrs(new Set((data ?? []).map((b: any) => b.person_id)));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey("last_name");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const setColumnFilter = (key: string, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!value || value === "all") delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const activeFilterCount = Object.keys(columnFilters).length + (globalFilter ? 1 : 0);

  const clearAllFilters = () => {
    setColumnFilters({});
    setGlobalFilter("");
  };

  const filtered = useMemo(() => {
    let result = persons;
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      result = result.filter((p) =>
        `${p.first_name ?? ""} ${p.middle_name ?? ""} ${p.last_name ?? ""} ${p.pnr} ${p.hsaid ?? ""} ${p.municipality ?? ""} ${p.county ?? ""} ${p.fb_postnr ?? ""} ${p.fb_postort ?? ""}`
          .toLowerCase().includes(q)
      );
    }
    for (const [key, value] of Object.entries(columnFilters)) {
      const v = value.toLowerCase();
      result = result.filter((p) => {
        if (key === "last_name") return `${p.first_name ?? ""} ${p.middle_name ?? ""} ${p.last_name ?? ""}`.toLowerCase().includes(v);
        if (key === "belongs_to_region_stockholm") {
          const boolVal = v === "ja";
          return p.belongs_to_region_stockholm === boolVal;
        }
        if (key === "works_rs") {
          const wantsYes = v === "ja";
          return wantsYes ? !!p.hsaid : !p.hsaid;
        }
        return String((p as any)[key] ?? "").toLowerCase().includes(v);
      });
    }
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let aVal: any = (a as any)[sortKey];
        let bVal: any = (b as any)[sortKey];
        aVal = aVal ?? ""; bVal = bVal ?? "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [persons, globalFilter, columnFilters, sortKey, sortDir]);

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey || !sortDir) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const ColumnHeaderWithFilter = ({ col }: { col: (typeof COLUMNS)[number] }) => {
    const hasFilter = !!columnFilters[col.key];
    return (
      <div className="flex flex-col gap-1">
        <button className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left" onClick={() => handleSort(col.key)}>
          <span>{col.label}</span>
          <SortIcon colKey={col.key} />
        </button>
        {col.filterable === "select" ? (
          <Select value={columnFilters[col.key] ?? "all"} onValueChange={(v) => setColumnFilter(col.key, v)}>
            <SelectTrigger className="h-7 text-xs w-full min-w-[80px]"><SelectValue placeholder="Alla" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              {col.options?.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
            </SelectContent>
          </Select>
        ) : col.filterable === "text" ? (
          <div className="relative">
            <Input placeholder="Filtrera..." value={columnFilters[col.key] ?? ""} onChange={(e) => setColumnFilter(col.key, e.target.value)} className="h-7 text-xs pr-6" />
            {hasFilter && (
              <button className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setColumnFilter(col.key, ""); }}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personregister</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} av {persons.length} testpersoner</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök namn, pnr, kommun, HSA-ID..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-10" />
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" /> Rensa filter ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="align-top py-2"><ColumnHeaderWithFilter col={col} /></TableHead>
                ))}
                <TableHead className="align-top py-2">Bokad RS</TableHead>
                <TableHead className="align-top py-2">Bokning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length + 2} className="text-center py-12 text-muted-foreground">Laddar...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length + 2} className="text-center py-12 text-muted-foreground">Inga personer matchar filtren</TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const isBooked = bookedPnrs.has(p.pnr);
                  return (
                    <TableRow key={p.pnr} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/relations?person=${p.pnr}`)}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {p.first_name} {p.middle_name ? `${p.middle_name} ` : ""}{p.last_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.pnr}</TableCell>
                      <TableCell>{p.gender === "M" ? "Man" : p.gender === "K" ? "Kvinna" : p.gender ?? "–"}</TableCell>
                      <TableCell>{p.municipality || "–"}</TableCell>
                      <TableCell>{p.county || "–"}</TableCell>
                      <TableCell>{p.fb_postort || "–"}</TableCell>
                      <TableCell>{p.fb_postnr || "–"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.hsaid || "–"}</TableCell>
                      <TableCell>
                        {p.belongs_to_region_stockholm ? (
                          <Badge variant="default" className="text-xs">Ja</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nej</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.hsaid ? (
                          <Badge variant="default" className="text-xs">Ja</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nej</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.booked_to_region_stockholm ? (
                          <Badge variant="default" className="text-xs">Ja</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nej</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isBooked ? (
                          <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">Bokad</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setBookingPnr(p.pnr)}>
                            <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Boka
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BookingDialog
        open={!!bookingPnr}
        onOpenChange={(o) => !o && setBookingPnr(null)}
        onCreated={refreshBookings}
        preselectedPersonPnr={bookingPnr}
      />
    </div>
  );
}
