import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, User, MapPin, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonResult {
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
  hsaid: string | null;
}

interface SearchResult {
  persons: PersonResult[];
  filters: Record<string, unknown>;
  reasoning: string;
  total: number;
}

function formatGender(g: string | null): string {
  if (g === "M") return "Man";
  if (g === "K") return "Kvinna";
  return g || "–";
}

export default function SearchPage() {
  const navigate = useNavigate();
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
    "Gift kvinna med barn i Stockholm",
    "Man som jobbar inom regionen",
    "Person med skyddad identitet",
    "Ogift person bosatt i Nacka",
    "Kvinna med barn i Solna",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sök testperson</h1>
        <p className="text-muted-foreground mt-1">Beskriv vilken typ av testperson du behöver med fritext</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='T.ex. "Kvinna bosatt i Solna med HSA-ID"'
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
              <CardTitle className="text-lg">Sökresultat ({result.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {result.persons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga matchande testpersoner hittades.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namn</TableHead>
                        <TableHead>Personnummer</TableHead>
                        <TableHead>Kön</TableHead>
                        <TableHead>Kommun</TableHead>
                        <TableHead>Postort</TableHead>
                        <TableHead>HSA-ID</TableHead>
                        <TableHead>Bokad RS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.persons.map((person) => (
                        <TableRow key={person.pnr} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/relations?person=${person.pnr}`)}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {person.first_name} {person.middle_name ? `${person.middle_name} ` : ""}{person.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{person.pnr}</TableCell>
                          <TableCell>{formatGender(person.gender)}</TableCell>
                          <TableCell>{person.municipality || "–"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {person.fb_postort || "–"}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{person.hsaid || "–"}</TableCell>
                          <TableCell>
                            {person.booked_to_region_stockholm ? (
                              <Badge variant="default" className="text-xs">Ja</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Nej</span>
                            )}
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
            <p className="text-sm text-muted-foreground">Ange en sökning ovan för att hitta matchande testpersoner.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
