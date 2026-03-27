import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Unlock, Search, ArrowUp, ArrowDown, ArrowUpDown, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Person {
  id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  personnummer: string | null;
  person_type: string;
  is_static: boolean;
  municipality: string | null;
  city: string | null;
  gender: string | null;
  region: string | null;
}

type SortDir = "asc" | "desc" | null;
type SortKey = keyof Person;

interface ColumnFilter {
  key: string;
  value: string;
}

const COLUMNS: { key: SortKey; label: string; filterable?: "select" | "text"; options?: string[] }[] = [
  { key: "last_name", label: "Namn", filterable: "text" },
  { key: "person_id", label: "Person-ID", filterable: "text" },
  { key: "personnummer", label: "Personnummer", filterable: "text" },
  { key: "person_type", label: "Typ", filterable: "select", options: ["Personal", "Invånare"] },
  { key: "is_static", label: "Status", filterable: "select", options: ["Statisk", "Dynamisk"] },
  { key: "gender", label: "Kön", filterable: "select", options: ["Man", "Kvinna"] },
  { key: "city", label: "Ort", filterable: "text" },
  { key: "region", label: "Region", filterable: "text" },
];

export default function PersonsPage() {
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("last_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("persons")
        .select("id, person_id, first_name, last_name, personnummer, person_type, is_static, municipality, city, gender, region")
        .order("last_name");
      setPersons(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

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

    // Global filter
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      result = result.filter((p) =>
        `${p.first_name} ${p.last_name} ${p.person_id} ${p.personnummer ?? ""} ${p.city ?? ""} ${p.region ?? ""}`
          .toLowerCase()
          .includes(q)
      );
    }

    // Column filters
    for (const [key, value] of Object.entries(columnFilters)) {
      const v = value.toLowerCase();
      result = result.filter((p) => {
        if (key === "is_static") {
          return v === "statisk" ? p.is_static : !p.is_static;
        }
        if (key === "last_name") {
          return `${p.first_name} ${p.last_name}`.toLowerCase().includes(v);
        }
        const cellValue = String((p as any)[key] ?? "").toLowerCase();
        return cellValue.includes(v);
      });
    }

    // Sort
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let aVal: any = (a as any)[sortKey];
        let bVal: any = (b as any)[sortKey];
        if (sortKey === "is_static") {
          aVal = a.is_static ? 0 : 1;
          bVal = b.is_static ? 0 : 1;
        }
        aVal = aVal ?? "";
        bVal = bVal ?? "";
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
        <button
          className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort(col.key)}
        >
          <span>{col.label}</span>
          <SortIcon colKey={col.key} />
        </button>
        {col.filterable === "select" ? (
          <Select
            value={columnFilters[col.key] ?? "all"}
            onValueChange={(v) => setColumnFilter(col.key, v)}
          >
            <SelectTrigger className="h-7 text-xs w-full min-w-[80px]">
              <SelectValue placeholder="Alla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              {col.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : col.filterable === "text" ? (
          <div className="relative">
            <Input
              placeholder="Filtrera..."
              value={columnFilters[col.key] ?? ""}
              onChange={(e) => setColumnFilter(col.key, e.target.value)}
              className="h-7 text-xs pr-6"
            />
            {hasFilter && (
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); setColumnFilter(col.key, ""); }}
              >
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
          <p className="text-muted-foreground mt-1">
            {filtered.length} av {persons.length} testpersoner
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök namn, ID, ort..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Rensa filter ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="align-top py-2">
                    <ColumnHeaderWithFilter col={col} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} className="text-center py-12 text-muted-foreground">
                    Laddar...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} className="text-center py-12 text-muted-foreground">
                    Inga personer matchar filtren
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/relations?person=${p.id}`)}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {p.first_name} {p.last_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.person_id}</TableCell>
                    <TableCell className="font-mono text-xs">{p.personnummer ?? "–"}</TableCell>
                    <TableCell>
                      <Badge variant={p.person_type === "Personal" ? "default" : "secondary"}>
                        {p.person_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.is_static ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--static-badge))]">
                          <Lock className="h-3 w-3" /> Statisk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
                          <Unlock className="h-3 w-3" /> Dynamisk
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{p.gender ?? "–"}</TableCell>
                    <TableCell>{p.city || p.municipality || "–"}</TableCell>
                    <TableCell>{p.region || "–"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
