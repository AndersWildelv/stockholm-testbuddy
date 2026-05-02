import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Users, FileText, ClipboardList, Trash2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CONFIRM_PHRASE = "RENSA";

export default function AdminPage() {
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setLastResult(null);
    // Tabeller med id-kolumn (uuid) respektive pnr-PK (kp_persons)
    const tables: { name: string; pk: string }[] = [
      { name: "bookings", pk: "id" },
      { name: "relations", pk: "id" },
      { name: "audit_log", pk: "id" },
      { name: "kp_person_relationships", pk: "id" },
      { name: "persons", pk: "id" },
      { name: "kp_persons", pk: "pnr" },
    ];
    const results: string[] = [];
    try {
      for (const { name, pk } of tables) {
        const { error, count } = await (supabase as any)
          .from(name)
          .delete({ count: "exact" })
          .not(pk, "is", null);
        if (error) {
          results.push(`❌ ${name}: ${error.message}`);
        } else {
          results.push(`✓ ${name}: ${count ?? 0} rader borttagna`);
        }
      }
      // Reset session-local state
      sessionStorage.removeItem("rs_gdpr_accepted");
      setLastResult(results.join("\n"));
      toast({
        title: "Databasen rensad",
        description: "Alla testpersoner, relationer och bokningar har tagits bort.",
      });
    } catch (e: any) {
      toast({
        title: "Fel vid rensning",
        description: e?.message ?? "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setConfirmText("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1">Hantera användare, importhistorik och audit-logg</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Användare
          </TabsTrigger>
          <TabsTrigger value="imports" className="gap-2">
            <FileText className="h-4 w-4" /> Importhistorik
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Audit-logg
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 data-[state=active]:text-destructive">
            <AlertTriangle className="h-4 w-4" /> Farozon
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" /> Användarroller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Funktionalitet för att tilldela admin/viewer-roller kommer här.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Importhistorik</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Tidigare importer med valideringsrapporter visas här.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit-logg</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Loggade händelser (importer, bokningar, sökningar) visas här.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Rensa databasen
              </CardTitle>
              <CardDescription>
                Tar permanent bort alla testpersoner, relationer, bokningar, importbatcher och
                audit-logg. Applikationen återställs till ett tomt utgångsläge. Denna åtgärd kan
                inte ångras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p className="font-medium text-destructive mb-2">Följande tabeller kommer att tömmas:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>kp_persons (alla testpersoner)</li>
                  <li>kp_person_relationships (alla relationer)</li>
                  <li>persons (legacy-tabell)</li>
                  <li>relations (legacy-tabell)</li>
                  <li>bookings (alla bokningar)</li>
                  <li>audit_log (audit-händelser)</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Importhistorik bevaras.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">
                  Skriv <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> för att bekräfta
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  className="max-w-xs"
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={confirmText !== CONFIRM_PHRASE || isResetting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isResetting ? "Rensar..." : "Rensa databasen och nollställ"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All data kommer att raderas permanent. Detta går inte att ångra.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReset}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Ja, rensa allt
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {lastResult && (
                <pre className="mt-4 rounded-md bg-muted p-3 text-xs whitespace-pre-wrap font-mono">
                  {lastResult}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
