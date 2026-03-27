import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Unlock, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  hsa_id: string | null;
}

export default function PersonsPage() {
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("persons")
        .select("id, person_id, first_name, last_name, personnummer, person_type, is_static, municipality, city, hsa_id")
        .order("last_name");
      setPersons(data ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = persons.filter((p) => {
    const matchesText =
      !filter ||
      `${p.first_name} ${p.last_name} ${p.person_id} ${p.personnummer ?? ""}`
        .toLowerCase()
        .includes(filter.toLowerCase());
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "static" && p.is_static) ||
      (typeFilter === "dynamic" && !p.is_static) ||
      (typeFilter === "personal" && p.person_type === "Personal") ||
      (typeFilter === "invånare" && p.person_type === "Invånare");
    return matchesText && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personregister</h1>
        <p className="text-muted-foreground mt-1">{persons.length} testpersoner totalt – klicka på en person för att se relationer</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök namn, ID..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrera typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla typer</SelectItem>
            <SelectItem value="static">Statiska</SelectItem>
            <SelectItem value="dynamic">Dynamiska</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="invånare">Invånare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Person-ID</TableHead>
              <TableHead>Personnummer</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ort</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Laddar...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Inga personer hittades
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/relations?person=${p.id}`)}
                >
                  <TableCell className="font-medium">
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
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <Unlock className="h-3 w-3" /> Dynamisk
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{p.city || p.municipality || "–"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
