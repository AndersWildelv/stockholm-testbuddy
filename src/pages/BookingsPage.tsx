import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Plus, Unlock, Clock, Pencil } from "lucide-react";
import { BookingDialog } from "@/components/BookingDialog";
import { PersonEditDialog } from "@/components/PersonEditDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Booking {
  id: string;
  person_id: string;
  booked_by_email: string | null;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface PersonInfo {
  pnr: string;
  first_name: string | null;
  last_name: string | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [personMap, setPersonMap] = useState<Record<string, PersonInfo>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [extendBookingId, setExtendBookingId] = useState<string | null>(null);
  const [newEndDate, setNewEndDate] = useState<Date>(addDays(new Date(), 7));
  const [editPersonPnr, setEditPersonPnr] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("id, person_id, booked_by_email, start_time, end_time, status, notes")
      .order("start_time", { ascending: false });

    const bookings = (bookingData as Booking[]) ?? [];
    setBookings(bookings);

    // Fetch person info for all booked pnrs
    const pnrs = [...new Set(bookings.map(b => b.person_id))];
    if (pnrs.length > 0) {
      const { data: persons } = await supabase
        .from("kp_persons" as any)
        .select("pnr, first_name, last_name")
        .in("pnr", pnrs);
      const map: Record<string, PersonInfo> = {};
      ((persons as any) ?? []).forEach((p: PersonInfo) => { map[p.pnr] = p; });
      setPersonMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const getEffectiveStatus = (b: Booking) => {
    if (b.status === "released") return "released";
    if (b.status === "active" && new Date(b.end_time) < new Date()) return "expired";
    return b.status;
  };

  const statusConfig = (s: string) => {
    if (s === "active") return { label: "Aktiv", variant: "default" as const, className: "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]" };
    if (s === "released") return { label: "Frigiven", variant: "secondary" as const, className: "" };
    return { label: "Utgången", variant: "outline" as const, className: "" };
  };

  const handleRelease = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "released" }).eq("id", id);
    if (error) { toast.error("Kunde inte frigöra: " + error.message); return; }
    toast.success("Testperson frigiven");
    fetchBookings();
  };

  const handleExtend = async () => {
    if (!extendBookingId) return;
    const { error } = await supabase
      .from("bookings")
      .update({ end_time: newEndDate.toISOString(), status: "active" })
      .eq("id", extendBookingId);
    if (error) { toast.error("Kunde inte förlänga: " + error.message); return; }
    toast.success("Bokning förlängd");
    setExtendBookingId(null);
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bokningar</h1>
          <p className="text-muted-foreground mt-1">Hantera bokningar av testpersoner</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ny bokning
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Testperson</TableHead>
              <TableHead>Personnummer</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Slut</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Anteckningar</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laddar...</TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Inga bokningar finns ännu. Klicka "Ny bokning" för att skapa en.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => {
                const effective = getEffectiveStatus(b);
                const config = statusConfig(effective);
                const person = personMap[b.person_id];
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {person ? `${person.first_name ?? ""} ${person.last_name ?? ""}` : "–"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{b.person_id}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(b.start_time), "d MMM yyyy", { locale: sv })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(b.end_time), "d MMM yyyy", { locale: sv })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className={config.className}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {b.notes ?? "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      {effective === "active" && (
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditPersonPnr(b.person_id)}>
                            <Pencil className="h-3 w-3 mr-1" /> Redigera
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setExtendBookingId(b.id); setNewEndDate(addDays(new Date(b.end_time), 7)); }}>
                            <Clock className="h-3 w-3 mr-1" /> Förläng
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRelease(b.id)}>
                            <Unlock className="h-3 w-3 mr-1" /> Frigör
                          </Button>
                        </div>
                      )}
                      {effective === "expired" && (
                        <Button variant="outline" size="sm" onClick={() => { setExtendBookingId(b.id); setNewEndDate(addDays(new Date(), 7)); }}>
                          <Clock className="h-3 w-3 mr-1" /> Förläng
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <BookingDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchBookings} />

      <PersonEditDialog
        open={!!editPersonPnr}
        onOpenChange={(o) => !o && setEditPersonPnr(null)}
        personPnr={editPersonPnr}
        onSaved={fetchBookings}
      />

      {/* Extend dialog */}
      <Dialog open={!!extendBookingId} onOpenChange={(o) => !o && setExtendBookingId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Förläng bokning</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nytt slutdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(newEndDate, "d MMMM yyyy", { locale: sv })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={(d) => d && setNewEndDate(d)}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExtendBookingId(null)}>Avbryt</Button>
            <Button onClick={handleExtend}>Spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
