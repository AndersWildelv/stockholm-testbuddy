import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Booking {
  id: string;
  person_id: string;
  booked_by_email: string | null;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  persons: { first_name: string; last_name: string; person_id: string } | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("bookings")
        .select("id, person_id, booked_by_email, start_time, end_time, status, notes, persons(first_name, last_name, person_id)")
        .order("start_time", { ascending: false });
      setBookings((data as any) ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "released") return "secondary";
    return "outline";
  };

  const statusLabel = (s: string) => {
    if (s === "active") return "Aktiv";
    if (s === "released") return "Frigiven";
    return "Utgången";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bokningar</h1>
        <p className="text-muted-foreground mt-1">Hantera bokningar av testpersoner</p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Testperson</TableHead>
              <TableHead>Bokad av</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Slut</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Anteckningar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Laddar...
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Inga bokningar finns ännu
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    {b.persons ? `${b.persons.first_name} ${b.persons.last_name}` : "–"}
                  </TableCell>
                  <TableCell className="text-sm">{b.booked_by_email ?? "–"}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(b.start_time), "d MMM yyyy HH:mm", { locale: sv })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(b.end_time), "d MMM yyyy HH:mm", { locale: sv })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(b.status) as any}>
                      {statusLabel(b.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {b.notes ?? "–"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
