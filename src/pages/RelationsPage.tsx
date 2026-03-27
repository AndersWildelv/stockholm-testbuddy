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
import { User, MapPin, Calendar, Shield, GitFork, ArrowLeft, X } from "lucide-react";

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
  person_type: string;
  is_static: boolean;
  city: string | null;
  postal_code: string | null;
  address: string | null;
}

interface RelationData {
  id: string;
  person_id: string;
  related_person_id: string;
  relation_type: string;
  valid_from: string | null;
  valid_to: string | null;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatGender(g: string | null): string {
  if (g === "M") return "Man";
  if (g === "K") return "Kvinna";
  return g || "–";
}

function formatCivil(c: string | null): string {
  if (!c) return "–";
  const trimmed = c.trim();
  const map: Record<string, string> = { OG: "Ogift", G: "Gift", S: "Skild", Ä: "Änka/Änkling" };
  return map[trimmed] || trimmed;
}

export default function RelationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personId = searchParams.get("person");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [allPersons, setAllPersons] = useState<PersonData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load graph data for a specific person
  const loadGraphForPerson = useCallback(async (focusPersonId: string) => {
    setLoading(true);

    // Fetch all relations involving this person
    const { data: relations } = await supabase
      .from("relations")
      .select("*")
      .or(`person_id.eq.${focusPersonId},related_person_id.eq.${focusPersonId}`);

    if (!relations || relations.length === 0) {
      // No relations, just show the person alone
      const { data: person } = await supabase
        .from("persons")
        .select("id, person_id, first_name, last_name, middle_name, personnummer, birth_date, gender, civil_status, birth_country, protected_identity, person_type, is_static, city, postal_code, address")
        .eq("id", focusPersonId)
        .single();

      if (person) {
        setAllPersons([person as PersonData]);
        setSelectedPerson(person as PersonData);
        setNodes([
          {
            id: person.id,
            position: { x: 400, y: 300 },
            data: { label: `${person.first_name} ${person.last_name}` },
            style: {
              background: "hsl(211, 68%, 40%)",
              color: "white",
              border: "2px solid hsl(211, 68%, 30%)",
              borderRadius: "12px",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: "600",
              minWidth: "140px",
              textAlign: "center" as const,
            },
          },
        ]);
        setEdges([]);
      }
      setLoading(false);
      return;
    }

    // Collect all person IDs involved
    const personIds = new Set<string>();
    personIds.add(focusPersonId);
    relations.forEach((r: RelationData) => {
      personIds.add(r.person_id);
      personIds.add(r.related_person_id);
    });

    // Also fetch 2nd-degree relations for connected persons
    const connectedIds = Array.from(personIds);
    const { data: secondDegreeRelations } = await supabase
      .from("relations")
      .select("*")
      .or(
        connectedIds.map(id => `person_id.eq.${id}`).join(",") + "," +
        connectedIds.map(id => `related_person_id.eq.${id}`).join(",")
      );

    if (secondDegreeRelations) {
      secondDegreeRelations.forEach((r: RelationData) => {
        personIds.add(r.person_id);
        personIds.add(r.related_person_id);
      });
    }

    const allRelations = [...relations, ...(secondDegreeRelations || [])];
    // Deduplicate relations by id
    const uniqueRelations = Array.from(new Map(allRelations.map(r => [r.id, r])).values());

    // Fetch all persons
    const { data: persons } = await supabase
      .from("persons")
      .select("id, person_id, first_name, last_name, middle_name, personnummer, birth_date, gender, civil_status, birth_country, protected_identity, person_type, is_static, city, postal_code, address")
      .in("id", Array.from(personIds));

    if (!persons) {
      setLoading(false);
      return;
    }

    setAllPersons(persons as PersonData[]);

    // Find the focus person
    const focusPerson = persons.find(p => p.id === focusPersonId);
    if (focusPerson) setSelectedPerson(focusPerson as PersonData);

    // Layout: place focus in center, others in a circle
    const otherPersons = persons.filter(p => p.id !== focusPersonId);
    const centerX = 450;
    const centerY = 350;
    const radius = 280;

    const newNodes: Node[] = [
      {
        id: focusPersonId,
        position: { x: centerX - 70, y: centerY - 20 },
        data: { label: focusPerson ? `${focusPerson.first_name} ${focusPerson.last_name}` : "Okänd" },
        style: {
          background: "hsl(211, 68%, 40%)",
          color: "white",
          border: "3px solid hsl(211, 68%, 25%)",
          borderRadius: "12px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "700",
          minWidth: "140px",
          textAlign: "center" as const,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        },
      },
    ];

    otherPersons.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / otherPersons.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 70;
      const y = centerY + radius * Math.sin(angle) - 20;

      newNodes.push({
        id: p.id,
        position: { x, y },
        data: { label: `${p.first_name} ${p.last_name}` },
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          border: "2px solid hsl(var(--border))",
          borderRadius: "10px",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: "500",
          minWidth: "120px",
          textAlign: "center" as const,
          cursor: "pointer",
        },
      });
    });

    // Build edges from unique relations
    const relationColors: Record<string, string> = {
      "Gift med": "#e11d48",
      "Syskon": "#2563eb",
      "Dotter till": "#7c3aed",
      "Son till": "#7c3aed",
      "Förälder": "#7c3aed",
      "Kusin": "#0891b2",
      "Granne": "#65a30d",
      "Kollega": "#d97706",
      "Mentor": "#9333ea",
    };

    const newEdges: Edge[] = uniqueRelations.map((r: RelationData) => ({
      id: r.id,
      source: r.person_id,
      target: r.related_person_id,
      label: r.relation_type,
      type: "default",
      animated: r.relation_type === "Gift med",
      style: {
        stroke: relationColors[r.relation_type] || "#888",
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: "11px",
        fontWeight: "600",
        fill: relationColors[r.relation_type] || "#888",
      },
      labelBgStyle: {
        fill: "hsl(var(--background))",
        fillOpacity: 0.9,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: relationColors[r.relation_type] || "#888",
        width: 16,
        height: 16,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [setNodes, setEdges]);

  // Load all persons with relations if no specific person selected
  const loadAllRelations = useCallback(async () => {
    setLoading(true);

    const { data: relations } = await supabase
      .from("relations")
      .select("*");

    if (!relations || relations.length === 0) {
      setLoading(false);
      return;
    }

    const personIds = new Set<string>();
    relations.forEach((r: RelationData) => {
      personIds.add(r.person_id);
      personIds.add(r.related_person_id);
    });

    const { data: persons } = await supabase
      .from("persons")
      .select("id, person_id, first_name, last_name, middle_name, personnummer, birth_date, gender, civil_status, birth_country, protected_identity, person_type, is_static, city, postal_code, address")
      .in("id", Array.from(personIds));

    if (!persons) {
      setLoading(false);
      return;
    }

    setAllPersons(persons as PersonData[]);

    // Grid layout
    const cols = Math.ceil(Math.sqrt(persons.length));
    const newNodes: Node[] = persons.map((p, i) => ({
      id: p.id,
      position: { x: (i % cols) * 220 + 50, y: Math.floor(i / cols) * 120 + 50 },
      data: { label: `${p.first_name} ${p.last_name}` },
      style: {
        background: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        border: "2px solid hsl(var(--border))",
        borderRadius: "10px",
        padding: "10px 16px",
        fontSize: "13px",
        fontWeight: "500",
        minWidth: "120px",
        textAlign: "center" as const,
        cursor: "pointer",
      },
    }));

    const relationColors: Record<string, string> = {
      "Gift med": "#e11d48",
      "Syskon": "#2563eb",
      "Dotter till": "#7c3aed",
      "Kusin": "#0891b2",
      "Granne": "#65a30d",
      "Kollega": "#d97706",
      "Mentor": "#9333ea",
    };

    // Deduplicate
    const uniqueRelations = Array.from(new Map(relations.map((r: RelationData) => [r.id, r])).values());
    const newEdges: Edge[] = uniqueRelations.map((r: RelationData) => ({
      id: r.id,
      source: r.person_id,
      target: r.related_person_id,
      label: r.relation_type,
      animated: r.relation_type === "Gift med",
      style: {
        stroke: relationColors[r.relation_type] || "#888",
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: "11px",
        fontWeight: "600",
        fill: relationColors[r.relation_type] || "#888",
      },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.9 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: relationColors[r.relation_type] || "#888",
        width: 16,
        height: 16,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (personId) {
      loadGraphForPerson(personId);
    } else {
      loadAllRelations();
    }
  }, [personId, loadGraphForPerson, loadAllRelations]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    const person = allPersons.find(p => p.id === node.id);
    if (person) setSelectedPerson(person);
  }, [allPersons]);

  const handleNodeDoubleClick = useCallback((_: any, node: Node) => {
    navigate(`/relations?person=${node.id}`);
  }, [navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relationer</h1>
          <p className="text-muted-foreground mt-1">
            {personId
              ? "Relationsgraf för vald person – dubbelklicka på en nod för att fokusera"
              : "Översikt av alla relationer – klicka för info, dubbelklicka för att fokusera"}
          </p>
        </div>
        {personId && (
          <Button variant="outline" onClick={() => navigate("/relations")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Visa alla
          </Button>
        )}
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 200px)" }}>
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
                <p className="text-xs">Denna person har inga registrerade relationer</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="hsl(var(--border))" gap={20} size={1} />
              <Controls
                showInteractive={false}
                style={{ bottom: 20, left: 20 }}
              />
              <Panel position="top-right">
                <div className="flex gap-2 flex-wrap text-xs">
                  {[
                    { label: "Gift med", color: "#e11d48" },
                    { label: "Syskon", color: "#2563eb" },
                    { label: "Familj", color: "#7c3aed" },
                    { label: "Kusin", color: "#0891b2" },
                    { label: "Granne", color: "#65a30d" },
                    { label: "Kollega", color: "#d97706" },
                    { label: "Mentor", color: "#9333ea" },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 border"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
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
                  <User className="h-4 w-4" />
                  Personinformation
                </CardTitle>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedPerson.first_name}{" "}
                  {selectedPerson.middle_name ? `${selectedPerson.middle_name} ` : ""}
                  {selectedPerson.last_name}
                </h3>
                <div className="flex gap-2 mt-1.5">
                  <Badge variant={selectedPerson.person_type === "Personal" ? "default" : "secondary"} className="text-xs">
                    {selectedPerson.person_type}
                  </Badge>
                  <Badge variant={selectedPerson.is_static ? "outline" : "default"} className="text-xs">
                    {selectedPerson.is_static ? "Statisk" : "Dynamisk"}
                  </Badge>
                  {selectedPerson.protected_identity && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Shield className="h-3 w-3" /> Skyddad
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <InfoRow label="Personnummer" value={selectedPerson.personnummer} mono />
                <InfoRow label="Person-ID" value={selectedPerson.person_id} mono />
                <InfoRow label="Kön" value={formatGender(selectedPerson.gender)} />
                <InfoRow
                  label="Ålder"
                  value={selectedPerson.birth_date ? `${calculateAge(selectedPerson.birth_date)} år (${selectedPerson.birth_date})` : null}
                />
                <InfoRow label="Civilstånd" value={formatCivil(selectedPerson.civil_status)} />
                <InfoRow label="Födelseland" value={selectedPerson.birth_country} />

                {(selectedPerson.address || selectedPerson.city) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-2 text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5 mt-0.5" />
                      <span className="text-xs font-medium uppercase tracking-wider">Adress</span>
                    </div>
                    {selectedPerson.address && (
                      <p className="text-sm ml-5">{selectedPerson.address}</p>
                    )}
                    {(selectedPerson.postal_code || selectedPerson.city) && (
                      <p className="text-sm ml-5">
                        {selectedPerson.postal_code} {selectedPerson.city}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate(`/relations?person=${selectedPerson.id}`)}
                >
                  <GitFork className="h-4 w-4" />
                  Visa relationer för denna person
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
