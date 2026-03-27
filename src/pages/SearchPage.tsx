import { useState } from "react";
import { Search, Loader2, User, MapPin, Calendar, Shield, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonResult {
  id: string;
  person_id: string;
  personnummer: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  birth_date: string | null;
  gender: string | null;
  civil_status: string | null;
  birth_country: string | null;
  protected_identity: boolean;
  person_type: string;
  is_static: boolean;
  city: string | null;
  postal_code: string | null;
  address: string | null;
}

interface SearchResult {
  persons: PersonResult[];
  filters: Record<string, unknown>;
  reasoning: string;
  total: number;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatGender(g: string | null): string {
  if (g === "M") return "Man";
  if (g === "K") return "Kvinna";
  return g || "–";
}

function formatCivil(c: string | null): string {
  if (!c) return "–";
  const trimmed = c.trim();
  const map: Record<string, string> = { OG: "Ogift", G: "Gift", S: "Skild", Ä: "Änka/Änkling" };
  return map[trimmed] || trimmed;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-search", {
        body: { query: query.trim() },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data as SearchResult);

      if (data.total === 0) {
        toast.info("Inga träffar hittades för din sökning.");
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error(err instanceof Error ? err.message : "Sökningen misslyckades");
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "Kvinna över 40 år bosatt i Stockholm",
    "Man född i Argentina",
    "Person med efternamn Andersson",
    "Ogift kvinna under 30 år",
    "Person bosatt i Nacka kommun",
    "Äldre person över 65 år",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sök testperson</h1>
        <p className="text-muted-foreground mt-1">
          Beskriv vilken typ av testperson du behöver med fritext
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='T.ex. "Kvinna över 65 år bosatt i Solna med skyddad identitet"'
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={!query.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sök"}
            </Button>
          </form>

          {!result && !isLoading && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Exempelsökningar:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setQuery(eq)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors text-foreground"
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">AI-motivering:</span> {result.reasoning}
              <span className="ml-2 text-muted-foreground">
                ({result.total} träff{result.total !== 1 ? "ar" : ""})
              </span>
            </AlertDescription>
          </Alert>

          {result.filters && Object.keys(result.filters).length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">Använda filter:</span>
              {Object.entries(result.filters).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Sökresultat ({result.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.persons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Inga matchande testpersoner hittades. Prova att bredda din sökning.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namn</TableHead>
                        <TableHead>Personnummer</TableHead>
                        <TableHead>Kön</TableHead>
                        <TableHead>Ålder</TableHead>
                        <TableHead>Ort</TableHead>
                        <TableHead>Civilstånd</TableHead>
                        <TableHead>Födelseland</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.persons.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {person.first_name}{" "}
                                {person.middle_name ? `${person.middle_name} ` : ""}
                                {person.last_name}
                              </span>
                              {person.protected_identity && (
                                <Shield className="h-3.5 w-3.5 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {person.personnummer || "–"}
                          </TableCell>
                          <TableCell>{formatGender(person.gender)}</TableCell>
                          <TableCell>
                            {person.birth_date
                              ? `${calculateAge(person.birth_date)} år`
                              : "–"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {person.city || "–"}
                            </div>
                          </TableCell>
                          <TableCell>{formatCivil(person.civil_status)}</TableCell>
                          <TableCell>{person.birth_country || "–"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                person.person_type === "Personal"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {person.person_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={person.is_static ? "outline" : "default"}
                              className="text-xs"
                            >
                              {person.is_static ? "Statisk" : "Dynamisk"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!result && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sökresultat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ange en sökning ovan för att hitta matchande testpersoner.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
