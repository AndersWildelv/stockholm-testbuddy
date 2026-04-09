import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, MapPin, GitFork, ArrowLeft, X, Search } from "lucide-react";

// Excluded relation types
const EXCLUDED_REL_TYPES = ["GR", "KO", "Granne", "Kollega", "granne", "kollega", "neighbor", "colleague", "Neighbor", "Colleague"];

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

interface RelationData {
  id: number;
  person_a: string;
  person_b: string;
  rel_typ: string;
  relation_label: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
}

function isExcludedRelation(r: RelationData): boolean {
  if (EXCLUDED_REL_TYPES.some(t => r.rel_typ?.toLowerCase() === t.toLowerCase())) return true;
  if (r.relation_label && EXCLUDED_REL_TYPES.some(t => r.relation_label!.toLowerCase().includes(t.toLowerCase()))) return true;
  return false;
}

function formatGender(g: string | null): string {
  if (g === "M") return "Man";
  if (g === "K") return "Kvinna";
  return g || "–";
}

export default function RelationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personPnr = searchParams.get("person");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [allPersons, setAllPersons] = useState<PersonData[]>([]);
  const [allRelations, setAllRelations] = useState<RelationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Search between two persons
  const [searchPnr1, setSearchPnr1] = useState("");
  const [searchPnr2, setSearchPnr2] = useState("");
  const [relTypeFilter, setRelTypeFilter] = useState<string>("all");
  const [availableRelTypes, setAvailableRelTypes] = useState<string[]>([]);

  // Relation list for selected person
  const [personRelations, setPersonRelations] = useState<RelationData[]>([]);

  const loadGraphForPerson = useCallback(async (focusPnr: string) => {
    setLoading(true);

    // Fetch all relations involving this person (excluding neighbors/colleagues)
    const { data: relations } = await supabase
      .from("kp_person_relationships" as any)
      .select("*")
      .or(`person_a.eq.${focusPnr},person_b.eq.${focusPnr}`);

    const filtered = ((relations as any) ?? []).filter((r: RelationData) => !isExcludedRelation(r));

    // Collect person pnrs
    const pnrs = new Set<string>();
    pnrs.add(focusPnr);
    filtered.forEach((r: RelationData) => {
      pnrs.add(r.person_a);
      pnrs.add(r.person_b);
    });

    // Fetch 2nd degree relations
    const connectedPnrs = Array.from(pnrs);
    const { data: secondDeg } = await supabase
      .from("kp_person_relationships" as any)
      .select("*")
      .or(
        connectedPnrs.map(p => `person_a.eq.${p}`).join(",") + "," +
        connectedPnrs.map(p => `person_b.eq.${p}`).join(",")
      );

    const secondFiltered = ((secondDeg as any) ?? []).filter((r: RelationData) => !isExcludedRelation(r));
    secondFiltered.forEach((r: RelationData) => {
      pnrs.add(r.person_a);
      pnrs.add(r.person_b);
    });

    const uniqueRelations = Array.from(
      new Map([...filtered, ...secondFiltered].map((r: RelationData) => [r.id, r])).values()
    );

    setAllRelations(uniqueRelations);
    setPersonRelations(filtered);

    // Collect all rel_types for filter
    const relTypes = ([...new Set(uniqueRelations.map((r: RelationData) => r.rel_typ))] as string[]).filter(Boolean).sort();
    setAvailableRelTypes(relTypes);

    // Fetch persons
    const { data: persons } = await supabase
      .from("kp_persons" as any)
      .select("pnr, first_name, middle_name, last_name, gender, municipality, county, fb_postnr, fb_postort, fb_address1, fb_address2, booked_to_region_stockholm, hsaid")
      .in("pnr", Array.from(pnrs));

    if (!persons) { setLoading(false); return; }

    setAllPersons(persons as unknown as PersonData[]);
    const focusPerson = (persons as unknown as PersonData[]).find(p => p.pnr === focusPnr);
    if (focusPerson) setSelectedPerson(focusPerson);

    // Build nodes
    const otherPersons = (persons as unknown as PersonData[]).filter(p => p.pnr !== focusPnr);
    const centerX = 450, centerY = 350, radius = 280;

    const newNodes: Node[] = [
      {
        id: focusPnr,
        position: { x: centerX - 70, y: centerY - 20 },
        data: { label: focusPerson ? `${focusPerson.first_name ?? ""} ${focusPerson.last_name ?? ""}` : focusPnr },
        style: {
          background: "hsl(211, 68%, 40%)", color: "white",
          border: "3px solid hsl(211, 68%, 25%)", borderRadius: "12px",
          padding: "12px 20px", fontSize: "14px", fontWeight: "700",
          minWidth: "140px", textAlign: "center" as const,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        },
      },
    ];

    otherPersons.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / otherPersons.length - Math.PI / 2;
      newNodes.push({
        id: p.pnr,
        position: { x: centerX + radius * Math.cos(angle) - 70, y: centerY + radius * Math.sin(angle) - 20 },
        data: { label: `${p.first_name ?? ""} ${p.last_name ?? ""}` },
        style: {
          background: "hsl(var(--card))", color: "hsl(var(--card-foreground))",
          border: "2px solid hsl(var(--border))", borderRadius: "10px",
          padding: "10px 16px", fontSize: "13px", fontWeight: "500",
          minWidth: "120px", textAlign: "center" as const, cursor: "pointer",
        },
      });
    });

    const relationColors: Record<string, string> = {
      "M": "#e11d48", "Gift med": "#e11d48",
      "B": "#7c3aed", "Barn": "#7c3aed",
      "SY": "#2563eb", "Syskon": "#2563eb",
      "FA": "#7c3aed", "Förälder": "#7c3aed",
      "KU": "#0891b2", "Kusin": "#0891b2",
    };

    const newEdges: Edge[] = uniqueRelations.map((r: RelationData) => ({
      id: String(r.id),
      source: r.person_a,
      target: r.person_b,
      label: r.relation_label || r.rel_typ,
      type: "default",
      animated: r.rel_typ === "M",
      style: { stroke: relationColors[r.rel_typ] || "#888", strokeWidth: 2 },
      labelStyle: { fontSize: "11px", fontWeight: "600", fill: relationColors[r.rel_typ] || "#888" },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.9 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color: relationColors[r.rel_typ] || "#888", width: 16, height: 16 },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [setNodes, setEdges]);

  const loadAllRelations = useCallback(async () => {
    setLoading(true);

    const { data: relations } = await supabase
      .from("kp_person_relationships" as any)
      .select("*")
      .limit(500);

    const filtered = ((relations as any) ?? []).filter((r: RelationData) => !isExcludedRelation(r));
    if (filtered.length === 0) { setLoading(false); return; }

    setAllRelations(filtered);
    const relTypes = ([...new Set(filtered.map((r: RelationData) => r.rel_typ))] as string[]).filter(Boolean).sort();
    setAvailableRelTypes(relTypes);

    const pnrs = new Set<string>();
    filtered.forEach((r: RelationData) => { pnrs.add(r.person_a); pnrs.add(r.person_b); });

    const { data: persons } = await supabase
      .from("kp_persons" as any)
      .select("pnr, first_name, middle_name, last_name, gender, municipality, county, fb_postnr, fb_postort, fb_address1, fb_address2, booked_to_region_stockholm, hsaid")
      .in("pnr", Array.from(pnrs));

    if (!persons) { setLoading(false); return; }
    setAllPersons(persons as unknown as PersonData[]);

    const cols = Math.ceil(Math.sqrt((persons as unknown as any[]).length));
    const newNodes: Node[] = (persons as unknown as PersonData[]).map((p, i) => ({
      id: p.pnr,
      position: { x: (i % cols) * 220 + 50, y: Math.floor(i / cols) * 120 + 50 },
      data: { label: `${p.first_name ?? ""} ${p.last_name ?? ""}` },
      style: {
        background: "hsl(var(--card))", color: "hsl(var(--card-foreground))",
        border: "2px solid hsl(var(--border))", borderRadius: "10px",
        padding: "10px 16px", fontSize: "13px", fontWeight: "500",
        minWidth: "120px", textAlign: "center" as const, cursor: "pointer",
      },
    }));

    const relationColors: Record<string, string> = {
      "M": "#e11d48", "B": "#7c3aed", "SY": "#2563eb", "FA": "#7c3aed", "KU": "#0891b2",
    };

    const newEdges: Edge[] = filtered.map((r: RelationData) => ({
      id: String(r.id),
      source: r.person_a,
      target: r.person_b,
      label: r.relation_label || r.rel_typ,
      animated: r.rel_typ === "M",
      style: { stroke: relationColors[r.rel_typ] || "#888", strokeWidth: 2 },
      labelStyle: { fontSize: "11px", fontWeight: "600", fill: relationColors[r.rel_typ] || "#888" },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.9 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color: relationColors[r.rel_typ] || "#888", width: 16, height: 16 },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (personPnr) {
      loadGraphForPerson(personPnr);
    } else {
      loadAllRelations();
    }
  }, [personPnr, loadGraphForPerson, loadAllRelations]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    const person = allPersons.find(p => p.pnr === node.id);
    if (person) setSelectedPerson(person);
  }, [allPersons]);

  const handleNodeDoubleClick = useCallback((_: any, node: Node) => {
    navigate(`/relations?person=${node.id}`);
  }, [navigate]);

  // Search relation between two persons
  const searchResults = searchPnr1 && searchPnr2
    ? allRelations.filter(r =>
        (r.person_a === searchPnr1 && r.person_b === searchPnr2) ||
        (r.person_a === searchPnr2 && r.person_b === searchPnr1)
      )
    : [];

  // Filtered relations for the person
  const filteredPersonRelations = personRelations.filter(r =>
    relTypeFilter === "all" || r.rel_typ === relTypeFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relationer</h1>
          <p className="text-muted-foreground mt-1">
            {personPnr
              ? "Relationsgraf för vald person – dubbelklicka på en nod för att fokusera"
              : "Översikt av alla relationer – klicka för info, dubbelklicka för att fokusera"}
          </p>
        </div>
        {personPnr && (
          <Button variant="outline" onClick={() => navigate("/relations")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Visa alla
          </Button>
        )}
      </div>

      {/* Search between two persons */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Person A (pnr)</label>
              <Input placeholder="Personnummer..." value={searchPnr1} onChange={e => setSearchPnr1(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Person B (pnr)</label>
              <Input placeholder="Personnummer..." value={searchPnr2} onChange={e => setSearchPnr2(e.target.value)} className="w-44" />
            </div>
            {availableRelTypes.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Relationstyp</label>
                <Select value={relTypeFilter} onValueChange={setRelTypeFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    {availableRelTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {searchPnr1 && searchPnr2 && (
            <div className="mt-3">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen relation hittad mellan dessa personer.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Person A</TableHead>
                      <TableHead>Person B</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Etikett</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Från</TableHead>
                      <TableHead>Till</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.person_a}</TableCell>
                        <TableCell className="font-mono text-xs">{r.person_b}</TableCell>
                        <TableCell>{r.rel_typ}</TableCell>
                        <TableCell>{r.relation_label || "–"}</TableCell>
                        <TableCell>{r.status || "–"}</TableCell>
                        <TableCell>{r.start_date || "–"}</TableCell>
                        <TableCell>{r.end_date || "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4" style={{ height: "calc(100vh - 360px)" }}>
        {/* Graph */}
        <div className="flex-1 rounded-lg border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <GitFork className="h-8 w-8 mx-auto animate-pulse" />
                <p>Laddar relationsgraf...</p>
              </div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <GitFork className="h-12 w-12 mx-auto opacity-30" />
                <p>Inga relationer hittades</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick} onNodeDoubleClick={handleNodeDoubleClick}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3} maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="hsl(var(--border))" gap={20} size={1} />
              <Controls showInteractive={false} style={{ bottom: 20, left: 20 }} />
              <Panel position="top-right">
                <div className="flex gap-2 flex-wrap text-xs">
                  {[
                    { label: "Gift (M)", color: "#e11d48" },
                    { label: "Barn (B)", color: "#7c3aed" },
                    { label: "Syskon (SY)", color: "#2563eb" },
                    { label: "Kusin (KU)", color: "#0891b2" },
                  ].map((item) => (
                    <span key={item.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 border">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>

        {/* Info panel */}
        {selectedPerson && (
          <Card className="w-80 shrink-0 overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Personinformation
                </CardTitle>
                <button onClick={() => setSelectedPerson(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedPerson.first_name} {selectedPerson.middle_name ? `${selectedPerson.middle_name} ` : ""}{selectedPerson.last_name}
                </h3>
                <div className="flex gap-2 mt-1.5">
                  {selectedPerson.booked_to_region_stockholm && (
                    <Badge variant="default" className="text-xs">Bokad RS</Badge>
                  )}
                  {selectedPerson.hsaid && (
                    <Badge variant="secondary" className="text-xs">HSA: {selectedPerson.hsaid}</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <InfoRow label="Personnummer" value={selectedPerson.pnr} mono />
                <InfoRow label="Kön" value={formatGender(selectedPerson.gender)} />
                <InfoRow label="Kommun" value={selectedPerson.municipality} />
                <InfoRow label="Län" value={selectedPerson.county} />

                {(selectedPerson.fb_address1 || selectedPerson.fb_postort) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-2 text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5 mt-0.5" />
                      <span className="text-xs font-medium uppercase tracking-wider">Adress</span>
                    </div>
                    {selectedPerson.fb_address1 && <p className="text-sm ml-5">{selectedPerson.fb_address1}</p>}
                    {selectedPerson.fb_address2 && <p className="text-sm ml-5">{selectedPerson.fb_address2}</p>}
                    {(selectedPerson.fb_postnr || selectedPerson.fb_postort) && (
                      <p className="text-sm ml-5">{selectedPerson.fb_postnr} {selectedPerson.fb_postort}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Person's relations list */}
              {personPnr && filteredPersonRelations.length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Relationer</h4>
                  <div className="space-y-1">
                    {filteredPersonRelations.map(r => {
                      const otherPnr = r.person_a === personPnr ? r.person_b : r.person_a;
                      const otherPerson = allPersons.find(p => p.pnr === otherPnr);
                      return (
                        <div key={r.id} className="text-xs flex justify-between items-center py-1 border-b border-border/50">
                          <span className="font-medium">
                            {otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : otherPnr}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{r.relation_label || r.rel_typ}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate(`/relations?person=${selectedPerson.pnr}`)}>
                  <GitFork className="h-4 w-4" /> Visa relationer för denna person
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value || value === "–") return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
