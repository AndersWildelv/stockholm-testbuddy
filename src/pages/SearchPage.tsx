import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  const [query, setQuery] = useState("");

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: AI search implementation
            }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='T.ex. "Kvinna över 65 år bosatt i Solna med skyddad identitet"'
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={!query.trim()}>
              Sök
            </Button>
          </form>
        </CardContent>
      </Card>

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
    </div>
  );
}
