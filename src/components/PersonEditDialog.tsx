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
  personId: string | null;
  onSaved: () => void;
}

interface PersonData {
  id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  personnummer: string | null;
  birth_date: string | null;
  gender: string | null;
  civil_status: string | null;
  birth_country: string | null;
  protected_identity: boolean;
  is_bookable: boolean;
  is_static: boolean;
  is_fictitious: boolean;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  municipality: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  hsa_id: string | null;
  county_code: string | null;
  municipality_code: string | null;
  parish_code: string | null;
  district_code: string | null;
  pnr_type: string | null;
}

const FIELD_GROUPS = [
  {
    label: "Grunduppgifter",
    fields: [
      { key: "first_name", label: "Förnamn", type: "text", required: true },
      { key: "middle_name", label: "Mellannamn", type: "text" },
      { key: "last_name", label: "Efternamn", type: "text", required: true },
      { key: "personnummer", label: "Personnummer", type: "text" },
      { key: "person_id", label: "Person-ID", type: "text", readonly: true },
      { key: "birth_date", label: "Födelsedatum", type: "date" },
      { key: "gender", label: "Kön", type: "select", options: ["M", "K"] },
      { key: "civil_status", label: "Civilstånd", type: "text" },
      { key: "birth_country", label: "Födelseland", type: "text" },
      { key: "pnr_type", label: "Personnummertyp", type: "text" },
    ],
  },
  {
    label: "Adress",
    fields: [
      { key: "address", label: "Adress", type: "text" },
      { key: "postal_code", label: "Postnummer", type: "text" },
      { key: "city", label: "Ort", type: "text" },
      { key: "municipality", label: "Kommun", type: "text" },
      { key: "region", label: "Region", type: "text" },
    ],
  },
  {
    label: "Kontakt",
    fields: [
      { key: "phone", label: "Telefon", type: "text" },
      { key: "email", label: "E-post", type: "text" },
      { key: "hsa_id", label: "HSA-ID", type: "text" },
    ],
  },
  {
    label: "Koder",
    fields: [
      { key: "county_code", label: "Länskod", type: "text" },
      { key: "municipality_code", label: "Kommunkod", type: "text" },
      { key: "parish_code", label: "Församlingskod", type: "text" },
      { key: "district_code", label: "Distriktskod", type: "text" },
    ],
  },
  {
    label: "Flaggor",
    fields: [
      { key: "protected_identity", label: "Skyddad identitet", type: "boolean" },
      { key: "is_bookable", label: "Bokningsbar", type: "boolean" },
      { key: "is_static", label: "Statisk", type: "boolean" },
      { key: "is_fictitious", label: "Fiktiv", type: "boolean" },
    ],
  },
] as const;

export function PersonEditDialog({ open, onOpenChange, personId, onSaved }: PersonEditDialogProps) {
  const [person, setPerson] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !personId) {
      setPerson(null);
      return;
    }
    setLoading(true);
    supabase
      .from("persons")
      .select("id, person_id, first_name, last_name, middle_name, personnummer, birth_date, gender, civil_status, birth_country, protected_identity, is_bookable, is_static, is_fictitious, address, postal_code, city, municipality, region, phone, email, hsa_id, county_code, municipality_code, parish_code, district_code, pnr_type")
      .eq("id", personId)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          toast.error("Kunde inte hämta person");
          return;
        }
        setPerson(data as PersonData);
      });
  }, [open, personId]);

  const updateField = (key: string, value: any) => {
    setPerson((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!person) return;
    setSaving(true);
    const { id, person_id, ...updateData } = person;
    const { error } = await supabase
      .from("persons")
      .update(updateData)
      .eq("id", id);
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
            {person ? `Redigera ${person.first_name} ${person.last_name}` : "Redigera person"}
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
                          <div key={key} className="flex items-center justify-between col-span-1 rounded-md border p-3">
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
                            type={field.type === "date" ? "date" : "text"}
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
