import { useEffect, useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";

interface BookablePerson {
  pnr: string;
  first_name: string | null;
  last_name: string | null;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  preselectedPersonPnr?: string | null;
}

export function BookingDialog({ open, onOpenChange, onCreated, preselectedPersonPnr }: BookingDialogProps) {
  const [persons, setPersons] = useState<BookablePerson[]>([]);
  const [bookedPnrs, setBookedPnrs] = useState<Set<string>>(new Set());
  const [selectedPnr, setSelectedPnr] = useState<string | null>(null);
  const [personSearchOpen, setPersonSearchOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const [{ data: personData }, { data: bookingData }] = await Promise.all([
        supabase
          .from("kp_persons" as any)
          .select("pnr, first_name, last_name")
          .order("last_name"),
        supabase
          .from("bookings")
          .select("person_id")
          .eq("status", "active"),
      ]);
      setPersons((personData as any) ?? []);
      setBookedPnrs(new Set((bookingData ?? []).map((b: any) => b.person_id)));
    }
    load();
  }, [open]);

  useEffect(() => {
    if (open && preselectedPersonPnr) {
      setSelectedPnr(preselectedPersonPnr);
    }
  }, [open, preselectedPersonPnr]);

  const availablePersons = useMemo(
    () => persons.filter((p) => !bookedPnrs.has(p.pnr)),
    [persons, bookedPnrs]
  );

  const selectedPerson = persons.find((p) => p.pnr === selectedPnr);

  const handleSubmit = async () => {
    if (!selectedPnr) {
      toast.error("Välj en testperson");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      person_id: selectedPnr,
      end_time: endDate.toISOString(),
      booked_by: "00000000-0000-0000-0000-000000000000",
      booked_by_email: "anon@app",
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Kunde inte skapa bokning: " + error.message);
      return;
    }
    toast.success("Bokning skapad!");
    setSelectedPnr(null);
    setEndDate(addDays(new Date(), 7));
    setNotes("");
    onOpenChange(false);
    onCreated();
  };

  const handleClose = () => {
    setSelectedPnr(null);
    setEndDate(addDays(new Date(), 7));
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ny bokning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Testperson</Label>
            <Popover open={personSearchOpen} onOpenChange={setPersonSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedPerson
                    ? `${selectedPerson.first_name ?? ""} ${selectedPerson.last_name ?? ""} (${selectedPerson.pnr})`
                    : "Välj testperson..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="Sök namn eller personnummer..." />
                  <CommandList>
                    <CommandEmpty>Inga lediga testpersoner hittades</CommandEmpty>
                    <CommandGroup>
                      {availablePersons.map((p) => (
                        <CommandItem
                          key={p.pnr}
                          value={`${p.first_name ?? ""} ${p.last_name ?? ""} ${p.pnr}`}
                          onSelect={() => {
                            setSelectedPnr(p.pnr);
                            setPersonSearchOpen(false);
                          }}
                        >
                          <span className="font-medium">{p.first_name} {p.last_name}</span>
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{p.pnr}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Slutdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "d MMMM yyyy", { locale: sv })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => d && setEndDate(d)}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Anteckningar (valfritt)</Label>
            <Textarea
              placeholder="T.ex. vilken test eller syfte..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Avbryt</Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedPnr}>
            {submitting ? "Skapar..." : "Boka"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
