import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function Login() {
  const { signIn, gdprAccepted, acceptGdpr } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprChecked, setGdprChecked] = useState(gdprAccepted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprChecked) {
      toast.error("Du måste godkänna GDPR-villkoren för att logga in.");
      return;
    }
    setLoading(true);
    try {
      if (!gdprAccepted) acceptGdpr();
      signIn(password);
      toast.success("Inloggad!");
    } catch (err: any) {
      toast.error(err.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            RS
          </div>
          <CardTitle className="text-2xl">Testdata Webapp</CardTitle>
          <CardDescription>Region Stockholm – Hantera testpersoner</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                <strong>GDPR-information:</strong> Denna plattform är avsedd enbart för <strong>fiktiv testdata</strong>. 
                Ingen personlig eller känslig data får registreras, laddas upp eller hanteras i systemet. 
                Genom att använda plattformen tar du personligt ansvar för att inte ange verklig persondata.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="gdpr"
                checked={gdprChecked}
                onCheckedChange={(checked) => setGdprChecked(checked === true)}
              />
              <Label htmlFor="gdpr" className="text-sm leading-tight cursor-pointer">
                Jag förstår och bekräftar att ingen personlig data ska användas i denna plattform och tar ansvar för att följa detta.
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !gdprChecked}>
              {loading ? "Laddar..." : "Logga in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
