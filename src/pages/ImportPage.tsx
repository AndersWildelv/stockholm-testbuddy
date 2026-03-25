import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Excel-import</h1>
        <p className="text-muted-foreground mt-1">Importera testpersoner från Excel-fil</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ladda upp fil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <FileUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Dra och släpp en Excel-fil här, eller klicka för att välja fil
            </p>
            <Button variant="outline">Välj fil</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
