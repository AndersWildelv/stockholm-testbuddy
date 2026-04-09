import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarClock, FileUp, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Stats {
  totalPersons: number;
  bookedRS: number;
  activeBookings: number;
  totalRelations: number;
}

export default function Index() {
  const [stats, setStats] = useState<Stats>({
    totalPersons: 0,
    bookedRS: 0,
    activeBookings: 0,
    totalRelations: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [persons, bookedRS, bookings, relations] = await Promise.all([
        supabase.from("kp_persons" as any).select("pnr", { count: "exact", head: true }),
        supabase.from("kp_v_region_stockholm_booked" as any).select("pnr", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("kp_person_relationships" as any).select("id", { count: "exact", head: true }),
      ]);
      setStats({
        totalPersons: (persons as any).count ?? 0,
        bookedRS: (bookedRS as any).count ?? 0,
        activeBookings: (bookings as any).count ?? 0,
        totalRelations: (relations as any).count ?? 0,
      });
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Totalt personer", value: stats.totalPersons, icon: Users, color: "text-primary" },
    { label: "Bokade RS", value: stats.bookedRS, icon: Building2, color: "text-[hsl(var(--static-badge))]" },
    { label: "Aktiva bokningar", value: stats.activeBookings, icon: CalendarClock, color: "text-warning" },
    { label: "Relationer", value: stats.totalRelations, icon: FileUp, color: "text-info" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Översikt över testdata i Region Stockholm</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Sök testperson</h3>
              <p className="text-sm text-muted-foreground">Beskriv önskad testperson med fritext</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/search">Sök</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Personregister</h3>
              <p className="text-sm text-muted-foreground">Visa alla testpersoner med filtrering</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/persons">Visa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
