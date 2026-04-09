import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface PersonEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personPnr: string | null;
  onSaved: () => void;
}

interface PersonData {
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

const FIELD_GROUPS = [
  {
    label: "Grunduppgifter",
    fields: [
      { key: "first_name", label: "Förnamn", type: "text" },
      { key: "middle_name", label: "Mellannamn", type: "text" },
      { key: "last_name", label: "Efternamn", type: "text" },
      { key: "pnr", label: "Personnummer", type: "text", readonly: true },
      { key: "gender", label: "Kön", type: "select", options: ["M", "K"] },
      { key: "hsaid", label: "HSA-ID", type: "text" },
    ],
  },
  {
    label: "Adress",
    fields: [
      { key: "fb_address1", label: "Adress 1", type: "text" },
      { key: "fb_address2", label: "Adress 2", type: "text" },
      { key: "fb_postnr", label: "Postnummer", type: "text" },
      { key: "fb_postort", label: "Postort", type: "text" },
      { key: "municipality", label: "Kommun", type: "text" },
      { key: "county", label: "Län", type: "text" },
    ],
  },
  {
    label: "Flaggor",
    fields: [
      { key: "booked_to_region_stockholm", label: "Bokad till Region Stockholm", type: "boolean" },
    ],
  },
] as const;

export function PersonEditDialog({ open, onOpenChange, personPnr, onSaved }: PersonEditDialogProps) {
  const [person, setPerson] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !personPnr) {
      setPerson(null);
      return;
    }
    setLoading(true);
    supabase
      .from("kp_persons" as any)
      .select("*")
      .eq("pnr", personPnr)
      .single()
      .then(({ data, error }: any) => {
        setLoading(false);
        if (error || !data) {
          toast.error("Kunde inte hämta person");
          return;
        }
        setPerson(data as PersonData);
      });
  }, [open, personPnr]);

  const updateField = (key: string, value: any) => {
    setPerson((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!person) return;
    setSaving(true);
    const { pnr, ...updateData } = person;
    // Remove timestamps from update
    const { created_at, updated_at, ...cleanData } = updateData as any;
    const { error } = await supabase
      .from("kp_persons" as any)
      .update(cleanData)
      .eq("pnr", pnr);
    setSaving(false);
    if (error) {
      toast.error("Kunde inte spara: " + error.message);
      return;
    }
    toast.success("Person uppdaterad!");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {person ? `Redigera ${person.first_name ?? ""} ${person.last_name ?? ""}` : "Redigera person"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Laddar...</div>
        ) : person ? (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-6 pb-4">
              {FIELD_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group.label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.fields.map((field) => {
                      const key = field.key as keyof PersonData;
                      const value = person[key];

                      if (field.type === "boolean") {
                        return (
                          <div key={key} className="flex items-center justify-between col-span-2 rounded-md border p-3">
                            <Label htmlFor={key} className="text-sm">{field.label}</Label>
                            <Switch
                              id={key}
                              checked={!!value}
                              onCheckedChange={(v) => updateField(key, v)}
                            />
                          </div>
                        );
                      }

                      if (field.type === "select" && "options" in field) {
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{field.label}</Label>
                            <Select
                              value={(value as string) ?? ""}
                              onValueChange={(v) => updateField(key, v || null)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Välj..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            type="text"
                            value={(value as string) ?? ""}
                            onChange={(e) => updateField(key, e.target.value || null)}
                            readOnly={"readonly" in field && field.readonly}
                            className={"readonly" in field && field.readonly ? "bg-muted" : ""}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving || !person}>
            {saving ? "Sparar..." : "Spara ändringar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
