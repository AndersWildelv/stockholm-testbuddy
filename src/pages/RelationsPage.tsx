import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitFork } from "lucide-react";

export default function RelationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relationer</h1>
        <p className="text-muted-foreground mt-1">Interaktiv graf över testpersoners relationer</p>
      </div>

      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitFork className="h-5 w-5" />
            Relationsgraf
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96 text-muted-foreground">
          <div className="text-center space-y-2">
            <GitFork className="h-12 w-12 mx-auto opacity-30" />
            <p>Relationsgrafen visas här när det finns data</p>
            <p className="text-xs">Importera testpersoner med relationer för att se grafen</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
