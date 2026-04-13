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
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { RELATION_TYPE_DESCRIPTIONS, getRelationDescription } from "@/lib/relationTypes";

function TooltipEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style, markerEnd, data, label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const relTyp = (data?.relTyp as string) || "";
  const description = RELATION_TYPE_DESCRIPTIONS[relTyp] || (label as string) || relTyp;

  return (
    <>
      <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd as string} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: (style?.stroke as string) || "#888",
                    background: "hsl(var(--background))",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    cursor: "default",
                    opacity: 0.95,
                  }}
                >
                  {(label as string) || relTyp}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs font-medium">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
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
  // Direct relations for info panel (fetched per selected person)
  const [selectedPersonRelations, setSelectedPersonRelations] = useState<RelationData[]>([]);

  const loadGraphForPerson = useCallback(async (focusPnr: string) => {
    setLoading(true);

    // Fetch all relations involving this person (excluding neighbors/colleagues)
    const { data: relations } = await supabase
      .from("kp_person_relationships" as any)
      .select("*")
      .or(`person_a.eq.${focusPnr},person_b.eq.${focusPnr}`);

    const filtered = ((relations as any) ?? []).filter((r: RelationData) => !isExcludedRelation(r));

    // Categorize each related person relative to the focus person
    const parents: string[] = [];
    const spouses: string[] = [];
    const siblings: string[] = [];
    const children: string[] = [];
    const cousins: string[] = [];
    const categorized = new Set<string>();

    for (const r of filtered) {
      const otherPnr = r.person_a === focusPnr ? r.person_b : r.person_a;
      if (categorized.has(otherPnr)) continue;

      const label = (r.relation_label || "").toLowerCase();
      const typ = (r.rel_typ || "").toUpperCase();

      if (typ === "M") {
        spouses.push(otherPnr);
      } else if (typ === "SY") {
        siblings.push(otherPnr);
      } else if (typ === "KU") {
        cousins.push(otherPnr);
      } else if (typ === "B" || typ === "FA") {
        if (label.includes("far") || label.includes("mor") || label.includes("förälder")) {
          parents.push(otherPnr);
        } else if (label.includes("barn")) {
          children.push(otherPnr);
        } else {
          // Fallback heuristic: for type B, if focus is person_a the other is likely child
          if (r.person_a === focusPnr && typ === "B") {
            children.push(otherPnr);
          } else {
            parents.push(otherPnr);
          }
        }
      } else {
        cousins.push(otherPnr);
      }
      categorized.add(otherPnr);
    }

    // Collect all unique pnrs
    const allPnrs = new Set<string>([focusPnr, ...parents, ...spouses, ...siblings, ...children, ...cousins]);

    // Fetch 2nd degree: children of children (grandchildren) and parents of parents (grandparents)
    const secondaryPnrs = [...parents, ...children];
    let secondDegRelations: RelationData[] = [];
    if (secondaryPnrs.length > 0) {
      const { data: secondDeg } = await supabase
        .from("kp_person_relationships" as any)
        .select("*")
        .or(
          secondaryPnrs.map(p => `person_a.eq.${p}`).join(",") + "," +
          secondaryPnrs.map(p => `person_b.eq.${p}`).join(",")
        );
      secondDegRelations = ((secondDeg as any) ?? []).filter((r: RelationData) => !isExcludedRelation(r));
    }

    // Grandparents: parents of parents
    const grandparents: string[] = [];
    for (const parentPnr of parents) {
      for (const r of secondDegRelations) {
        if (r.person_a !== parentPnr && r.person_b !== parentPnr) continue;
        const otherPnr = r.person_a === parentPnr ? r.person_b : r.person_a;
        if (allPnrs.has(otherPnr)) continue;
        const label = (r.relation_label || "").toLowerCase();
        const typ = (r.rel_typ || "").toUpperCase();
        if (typ === "B" || typ === "FA") {
          if (label.includes("far") || label.includes("mor") || label.includes("förälder")) {
            grandparents.push(otherPnr);
            allPnrs.add(otherPnr);
          }
        }
      }
    }

    // Grandchildren: children of children
    const grandchildren: string[] = [];
    for (const childPnr of children) {
      for (const r of secondDegRelations) {
        if (r.person_a !== childPnr && r.person_b !== childPnr) continue;
        const otherPnr = r.person_a === childPnr ? r.person_b : r.person_a;
        if (allPnrs.has(otherPnr)) continue;
        const label = (r.relation_label || "").toLowerCase();
        const typ = (r.rel_typ || "").toUpperCase();
        if (typ === "B" || typ === "FA") {
          if (label.includes("barn")) {
            grandchildren.push(otherPnr);
            allPnrs.add(otherPnr);
          }
        }
      }
    }

    // Deduplicate edges: keep one edge per unique pair
    const allRels = [...filtered, ...secondDegRelations];
    const edgeMap = new Map<string, RelationData>();
    for (const r of allRels) {
      const key = [r.person_a, r.person_b].sort().join("-") + "-" + r.rel_typ;
      if (!edgeMap.has(key)) edgeMap.set(key, r);
    }
    const uniqueRelations = Array.from(edgeMap.values()).filter(r => {
      return allPnrs.has(r.person_a) && allPnrs.has(r.person_b);
    });

    setAllRelations(uniqueRelations);
    setPersonRelations(filtered);

    const relTypes = ([...new Set(uniqueRelations.map((r: RelationData) => r.rel_typ))] as string[]).filter(Boolean).sort();
    setAvailableRelTypes(relTypes);

    // Fetch persons
    const { data: persons } = await supabase
      .from("kp_persons" as any)
      .select("pnr, first_name, middle_name, last_name, gender, municipality, county, fb_postnr, fb_postort, fb_address1, fb_address2, booked_to_region_stockholm, hsaid")
      .in("pnr", Array.from(allPnrs));

    if (!persons) { setLoading(false); return; }
    setAllPersons(persons as unknown as PersonData[]);
    const personMap = new Map((persons as unknown as PersonData[]).map(p => [p.pnr, p]));
    const focusPerson = personMap.get(focusPnr);
    if (focusPerson) setSelectedPerson(focusPerson);

    // ── Tree Layout ──
    const nodeW = 160;
    const nodeH = 50;
    const hGap = 40;
    const layerGap = 160;

    function getLabel(pnr: string) {
      const p = personMap.get(pnr);
      return p ? `${p.first_name ?? ""} ${p.middle_name ? p.middle_name + " " : ""}${p.last_name ?? ""}` : pnr;
    }

    // Layers from top to bottom:
    // 0: grandparents, 1: parents, 2: focus+spouse+siblings+cousins, 3: children, 4: grandchildren
    const layers: string[][] = [
      grandparents,
      parents,
      [focusPnr, ...spouses, ...siblings, ...cousins],
      children,
      grandchildren,
    ];

    // Find widest layer for centering
    const layerWidths = layers.map(l => l.length * nodeW + Math.max(0, l.length - 1) * hGap);
    const maxWidth = Math.max(...layerWidths, 400);
    const centerX = maxWidth / 2;

    const newNodes: Node[] = [];
    layers.forEach((layer, li) => {
      if (layer.length === 0) return;
      const totalW = layer.length * nodeW + (layer.length - 1) * hGap;
      const startX = centerX - totalW / 2;
      const y = li * layerGap;

      layer.forEach((pnr, i) => {
        const isFocus = pnr === focusPnr;
        newNodes.push({
          id: pnr,
          position: { x: startX + i * (nodeW + hGap), y },
          data: { label: getLabel(pnr) },
          style: isFocus
            ? {
                background: "hsl(211, 68%, 40%)", color: "white",
                border: "3px solid hsl(211, 68%, 25%)", borderRadius: "12px",
                padding: "12px 20px", fontSize: "14px", fontWeight: "700",
                minWidth: `${nodeW}px`, textAlign: "center" as const,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }
            : {
                background: "hsl(var(--card))", color: "hsl(var(--card-foreground))",
                border: "2px solid hsl(var(--border))", borderRadius: "10px",
                padding: "10px 16px", fontSize: "13px", fontWeight: "500",
                minWidth: `${nodeW}px`, textAlign: "center" as const, cursor: "pointer",
              },
        });
      });
    });

    const relationColors: Record<string, string> = {
      "M": "#e11d48", "Gift med": "#e11d48",
      "B": "#7c3aed", "Barn": "#7c3aed",
      "SY": "#2563eb", "Syskon": "#2563eb",
      "FA": "#7c3aed", "Förälder": "#7c3aed",
      "KU": "#0891b2", "Kusin": "#0891b2",
    };

    const newEdges: Edge[] = uniqueRelations.map((r: RelationData) => {
      const color = relationColors[r.rel_typ] || "#888";
      const isMarriage = r.rel_typ === "M";
      return {
        id: String(r.id),
        source: r.person_a,
        target: r.person_b,
        label: r.relation_label || r.rel_typ,
        type: "tooltip",
        data: { relTyp: r.rel_typ },
        animated: false,
        style: {
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: isMarriage ? "8 4" : undefined,
        },
        markerEnd: isMarriage ? undefined : { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      };
    });

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

  const handleNodeClick = useCallback(async (_: any, node: Node) => {
    const person = allPersons.find(p => p.pnr === node.id);
    if (person) {
      setSelectedPerson(person);
      // Fetch all direct relations for this person for the info panel
      const { data: rels } = await supabase
        .from("kp_person_relationships" as any)
        .select("*")
        .or(`person_a.eq.${node.id},person_b.eq.${node.id}`);
      const filtered = ((rels as any) ?? []).filter((r: RelationData) => !isExcludedRelation(r));
      // Deduplicate
      const edgeMap = new Map<string, RelationData>();
      for (const r of filtered) {
        const key = [r.person_a, r.person_b].sort().join("-") + "-" + r.rel_typ;
        if (!edgeMap.has(key)) edgeMap.set(key, r);
      }
      setSelectedPersonRelations(Array.from(edgeMap.values()));
    }
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

  // Filtered relations for the currently selected person
  const selectedPnr = selectedPerson?.pnr || personPnr;
  const displayedRelations = (selectedPersonRelations.length > 0 ? selectedPersonRelations : allRelations.filter(r =>
    r.person_a === selectedPnr || r.person_b === selectedPnr
  )).filter(r =>
    relTypeFilter === "all" || r.rel_typ === relTypeFilter
  );

  return (
    <TooltipProvider delayDuration={200}>
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
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dotted border-muted-foreground/50">{r.rel_typ}</span>
                            </TooltipTrigger>
                            <TooltipContent>{getRelationDescription(r.rel_typ) || r.relation_label || r.rel_typ}</TooltipContent>
                          </Tooltip>
                        </TableCell>
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
              edgeTypes={{ tooltip: TooltipEdge }}
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
              {selectedPnr && displayedRelations.length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Relationer</h4>
                  <div className="space-y-1">
                    {(() => {
                      // Deduplicate: group by other person, collect unique relation descriptions
                      const grouped = new Map<string, { otherPnr: string; labels: Set<string> }>();
                      for (const r of displayedRelations) {
                        const otherPnr = r.person_a === selectedPnr ? r.person_b : r.person_a;
                        if (!otherPnr || otherPnr === selectedPnr) continue;
                        if (!grouped.has(otherPnr)) {
                          grouped.set(otherPnr, { otherPnr, labels: new Set() });
                        }
                        const desc = getRelationDescription(r.rel_typ) || r.relation_label || r.rel_typ;
                        if (desc) grouped.get(otherPnr)!.labels.add(desc);
                      }
                      return Array.from(grouped.values()).map(({ otherPnr, labels }) => {
                        const otherPerson = allPersons.find(p => p.pnr === otherPnr);
                        const displayLabel = Array.from(labels).join(", ");
                        return (
                          <div key={otherPnr} className="text-xs flex justify-between items-center py-1 border-b border-border/50">
                            <span className="font-medium">
                              {otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : otherPnr}
                            </span>
                            <Badge variant="outline" className="text-[10px]">{displayLabel}</Badge>
                          </div>
                        );
                      });
                    })()}
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
    </TooltipProvider>
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
