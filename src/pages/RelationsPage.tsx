import { useCallback, useEffect, useMemo, useState } from "react";
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
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RELATION_TYPE_DESCRIPTIONS, getRelationDescription } from "@/lib/relationTypes";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, GitFork, ArrowLeft, X, ChevronRight } from "lucide-react";

const EXCLUDED_REL_TYPES = ["GR", "KO", "KU"];

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

interface PersonExtra {
  pnr: string;
  fod_datum: string | null;
  antraffad_dod: string | null;
  civ: string | null;
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

interface AfbRelationData {
  id: number;
  pnr: string;
  rel_typ: string;
  afb_rel_fnamn: string | null;
  afb_rel_mnamn: string | null;
  afb_rel_enamn: string | null;
  afb_rel_fodtid: string | null;
  rel_avr_datum: string | null;
}

function isExcluded(t: string | null | undefined) {
  if (!t) return false;
  return EXCLUDED_REL_TYPES.includes(t.toUpperCase());
}

function birthYearFromPnr(pnr: string | null | undefined): string | null {
  if (!pnr) return null;
  const m = pnr.match(/^(18|19|20)\d{2}/);
  return m ? pnr.slice(0, 4) : null;
}

function birthYearFrom(pnr: string | null | undefined, fodDatum: string | null | undefined): string | null {
  return birthYearFromPnr(pnr) ?? (fodDatum ? fodDatum.slice(0, 4) : null);
}

function genderSymbol(g: string | null | undefined) {
  if (g === "K") return "♀";
  if (g === "M") return "♂";
  return "";
}

function clean(s: string | null | undefined): string {
  if (!s) return "";
  // Strip surrounding slashes that PU service uses for unverified names
  return s.replace(/^\/+|\/+$/g, "").trim();
}

function fullName(p: { first_name?: string | null; middle_name?: string | null; last_name?: string | null }) {
  return [clean(p.first_name), clean(p.middle_name), clean(p.last_name)].filter(Boolean).join(" ").trim();
}

// ───────── Custom Node ─────────
type PersonNodeData = {
  name: string;
  pnr: string;
  gender: string | null;
  birthYear: string | null;
  deceased: boolean;
  isFocus: boolean;
  variant: "focus" | "parent" | "grandparent" | "sibling" | "partner" | "child" | "grandchild" | "missing-fb" | "missing-afb";
  tooltip?: string;
  onClick?: () => void;
};

function PersonNode({ data }: NodeProps) {
  const d = data as PersonNodeData;
  const isMissing = d.variant === "missing-fb" || d.variant === "missing-afb";

  const baseStyle: React.CSSProperties = {
    minWidth: 170,
    padding: "8px 12px",
    borderRadius: 10,
    background: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    border: "1.5px solid hsl(var(--border))",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  };

  if (d.isFocus) {
    Object.assign(baseStyle, {
      border: "3px solid hsl(var(--primary))",
      background: "hsl(var(--primary) / 0.08)",
      boxShadow: "0 4px 16px hsl(var(--primary) / 0.25)",
    });
  } else if (d.variant === "partner") {
    baseStyle.borderColor = "#e11d48";
  } else if (isMissing) {
    Object.assign(baseStyle, {
      borderStyle: "dashed",
      opacity: 0.6,
      background: "hsl(var(--muted))",
    });
  }

  const inner = (
    <div style={baseStyle} onClick={d.onClick}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{ fontWeight: d.isFocus ? 700 : 600, lineHeight: 1.2 }}>
        {d.name}
        {d.deceased && <span style={{ marginLeft: 4 }}>†</span>}
      </div>
      <div style={{ fontSize: 10, opacity: 0.65, fontFamily: "monospace", marginTop: 2 }}>
        {d.pnr}
      </div>
      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
        {[genderSymbol(d.gender), d.birthYear].filter(Boolean).join(" · ")}
        {isMissing && (
          <span style={{ fontStyle: "italic" }}>
            {" "}
            {d.variant === "missing-fb" ? "(ej i datasetet)" : "(utan svenskt pnr)"}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );

  if (!d.tooltip) return inner;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-line">{d.tooltip}</TooltipContent>
    </Tooltip>
  );
}

const nodeTypes = { person: PersonNode };

// ───────── Page ─────────
export default function RelationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personPnr = searchParams.get("person");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [allPersons, setAllPersons] = useState<PersonData[]>([]);
  const [allExtras, setAllExtras] = useState<Map<string, PersonExtra>>(new Map());
  const [selectedPersonRelations, setSelectedPersonRelations] = useState<RelationData[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const personByPnr = useMemo(() => new Map(allPersons.map(p => [p.pnr, p])), [allPersons]);

  const buildTree = useCallback(async (focusPnr: string) => {
    setLoading(true);

    // Step 1: relations of focus
    const { data: focusRels } = await supabase
      .from("kp_person_relationships" as any)
      .select("*")
      .or(`person_a.eq.${focusPnr},person_b.eq.${focusPnr}`);
    const focusRelations = ((focusRels as any[]) ?? []).filter(r => !isExcluded(r.rel_typ)) as RelationData[];

    // Categorize. Convention: rel_typ describes person_b's role TO person_a.
    // person_a -[MO/FA/F/V/VF]-> person_b means person_b is parent of person_a
    // person_a -[B]-> person_b means person_b is child of person_a
    // person_a -[M/P]-> person_b means partners
    const parents = new Set<string>();
    const children = new Set<string>();
    const partners = new Set<string>();
    const biologicalParents = new Set<string>(); // MO/FA/F/B (not V/VF)
    const guardianFlags = new Set<string>(); // V/VF candidates

    const BIO_PARENT_TYPES = ["MO", "FA", "F"];
    const GUARDIAN_TYPES = ["V", "VF"];
    const PARENT_TYPES = [...BIO_PARENT_TYPES, ...GUARDIAN_TYPES];
    for (const r of focusRelations) {
      const t = r.rel_typ.toUpperCase();
      const a = r.person_a, b = r.person_b;
      if (a === focusPnr) {
        if (PARENT_TYPES.includes(t)) {
          parents.add(b);
          if (BIO_PARENT_TYPES.includes(t)) biologicalParents.add(b);
          else guardianFlags.add(b);
        } else if (t === "B") children.add(b);
        else if (t === "M" || t === "P") partners.add(b);
      } else if (b === focusPnr) {
        if (BIO_PARENT_TYPES.includes(t)) {
          parents.add(a);
          biologicalParents.add(a);
        } else if (GUARDIAN_TYPES.includes(t)) {
          // (X, focus, VF) means X is guardian of focus -> X is parent
          parents.add(a);
          guardianFlags.add(a);
        } else if (t === "B") parents.add(a); // (X, focus, B) means focus is child of X
        else if (t === "M" || t === "P") partners.add(a);
      }
    }
    // A guardian-only flag means: never appears as MO/FA/F → mark as non-bio
    const guardiansOnly = new Set<string>();
    for (const g of guardianFlags) if (!biologicalParents.has(g)) guardiansOnly.add(g);

    // Step 2: get grandparents, grandchildren, sibling-detection via shared parents
    // Need: parents-of-parents, parents-of-children's children, and parents-of-anyone-who-shares-our-parents
    const tier2Pnrs = [...parents, ...children];
    let tier2Rels: RelationData[] = [];
    if (tier2Pnrs.length) {
      const { data: t2 } = await supabase
        .from("kp_person_relationships" as any)
        .select("*")
        .or([
          ...tier2Pnrs.map(p => `person_a.eq.${p}`),
          ...tier2Pnrs.map(p => `person_b.eq.${p}`),
        ].join(","));
      tier2Rels = ((t2 as any[]) ?? []).filter(r => !isExcluded(r.rel_typ)) as RelationData[];
    }

    const grandparents = new Map<string, Set<string>>(); // grandparentPnr -> set of parentPnrs
    const grandchildren = new Map<string, Set<string>>(); // grandchildPnr -> set of childPnrs
    for (const r of tier2Rels) {
      const t = r.rel_typ.toUpperCase();
      const a = r.person_a, b = r.person_b;
      // grandparents of focus: parents of "parents"
      for (const par of parents) {
        if (a === par && PARENT_TYPES.includes(t)) {
          if (!grandparents.has(b)) grandparents.set(b, new Set());
          grandparents.get(b)!.add(par);
        } else if (b === par && t === "B") {
          if (!grandparents.has(a)) grandparents.set(a, new Set());
          grandparents.get(a)!.add(par);
        }
      }
      // grandchildren of focus: children of "children"
      for (const ch of children) {
        if (a === ch && t === "B") {
          if (!grandchildren.has(b)) grandchildren.set(b, new Set());
          grandchildren.get(b)!.add(ch);
        } else if (b === ch && PARENT_TYPES.includes(t)) {
          if (!grandchildren.has(a)) grandchildren.set(a, new Set());
          grandchildren.get(a)!.add(ch);
        }
      }
    }

    // Siblings: anyone who shares ≥1 parent with focus, excluding focus/partners/parents/children
    // We need everyone whose parent ∈ parents.
    const siblingMap = new Map<string, Set<string>>(); // siblingPnr -> shared parent set
    let siblingCandidateRels: RelationData[] = [];
    if (parents.size > 0) {
      const parentList = Array.from(parents);
      const { data: sc } = await supabase
        .from("kp_person_relationships" as any)
        .select("*")
        .or([
          ...parentList.map(p => `person_a.eq.${p}`),
          ...parentList.map(p => `person_b.eq.${p}`),
        ].join(","));
      siblingCandidateRels = ((sc as any[]) ?? []).filter(r => !isExcluded(r.rel_typ)) as RelationData[];
    }
    for (const r of siblingCandidateRels) {
      const t = r.rel_typ.toUpperCase();
      const a = r.person_a, b = r.person_b;
      // if parent->child via B
      if (parents.has(a) && t === "B" && b !== focusPnr) {
        if (!siblingMap.has(b)) siblingMap.set(b, new Set());
        siblingMap.get(b)!.add(a);
      }
      // if child->parent via MO/FA/F (V/VF excluded for biological siblings)
      if (parents.has(b) && ["MO", "FA", "F"].includes(t) && a !== focusPnr) {
        if (!siblingMap.has(a)) siblingMap.set(a, new Set());
        siblingMap.get(a)!.add(b);
      }
    }
    // Remove false positives
    for (const k of Array.from(siblingMap.keys())) {
      if (parents.has(k) || children.has(k) || partners.has(k) || k === focusPnr) {
        siblingMap.delete(k);
      }
    }

    // Step 3: AfbRelations (foreign relatives without pnr)
    const { data: afbData } = await supabase
      .from("afb_relation" as any)
      .select("id, pnr, rel_typ, afb_rel_fnamn, afb_rel_mnamn, afb_rel_enamn, afb_rel_fodtid, rel_avr_datum")
      .eq("pnr", focusPnr);
    const afbRels = ((afbData as any[]) ?? []).filter(r => !isExcluded(r.rel_typ)) as AfbRelationData[];

    // Step 4: fetch person info for ALL pnrs we want to display
    const allPnrs = new Set<string>([
      focusPnr,
      ...parents, ...children, ...partners,
      ...siblingMap.keys(),
      ...grandparents.keys(),
      ...grandchildren.keys(),
    ]);
    const { data: persons } = await supabase
      .from("kp_persons" as any)
      .select("pnr, first_name, middle_name, last_name, gender, municipality, county, fb_postnr, fb_postort, fb_address1, fb_address2, booked_to_region_stockholm, hsaid")
      .in("pnr", Array.from(allPnrs));
    const personArr = (persons as any[] ?? []) as PersonData[];
    setAllPersons(personArr);
    const pMap = new Map(personArr.map(p => [p.pnr, p]));

    // Fetch extras (deceased, fod_datum, civ) for tooltip + indicators
    const { data: extras } = await supabase
      .from("person" as any)
      .select("pnr, fod_datum, antraffad_dod, civ")
      .in("pnr", Array.from(allPnrs));
    const extrasMap = new Map(((extras as any[]) ?? []).map(e => [e.pnr, e as PersonExtra]));
    setAllExtras(extrasMap);

    const focusP = pMap.get(focusPnr);
    if (focusP) setSelectedPerson(focusP);
    setSelectedPersonRelations(focusRelations);

    // ─── LAYOUT ───
    const NODE_W = 180;
    const H_GAP = 30;
    const V_GAP = 140;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    function makeNode(
      pnr: string,
      x: number,
      y: number,
      variant: PersonNodeData["variant"],
      opts: { afb?: AfbRelationData } = {},
    ): Node {
      const isMissing = variant === "missing-fb" || variant === "missing-afb";
      const p = pMap.get(pnr);
      const ex = extrasMap.get(pnr);
      let name = p ? fullName(p) || pnr : pnr;
      let pnrLabel = pnr;
      let gender: string | null = p?.gender ?? null;
      let birthYear = birthYearFrom(pnr, ex?.fod_datum);
      let deceased = !!(ex?.antraffad_dod && ex.antraffad_dod.trim() !== "");

      if (variant === "missing-afb" && opts.afb) {
        name = [opts.afb.afb_rel_fnamn, opts.afb.afb_rel_mnamn, opts.afb.afb_rel_enamn]
          .filter(Boolean).join(" ").trim() || "Okänd";
        pnrLabel = "—";
        birthYear = opts.afb.afb_rel_fodtid ? opts.afb.afb_rel_fodtid.slice(0, 4) : null;
        gender = null;
      }

      const tooltipLines: string[] = [];
      if (p) {
        tooltipLines.push(fullName(p));
        tooltipLines.push(`pnr: ${p.pnr}`);
        if (ex?.fod_datum) tooltipLines.push(`Födelsedatum: ${ex.fod_datum}`);
        if (ex?.civ) tooltipLines.push(`Civilstånd: ${ex.civ}`);
        const addr = [p.fb_address1, p.fb_postnr, p.fb_postort].filter(Boolean).join(", ");
        if (addr) tooltipLines.push(addr);
      } else if (isMissing) {
        tooltipLines.push(name);
        tooltipLines.push(variant === "missing-fb" ? "Person saknas i datasetet" : "Anhörig utan svenskt personnummer");
      }

      const data: PersonNodeData = {
        name,
        pnr: pnrLabel,
        gender,
        birthYear,
        deceased,
        isFocus: pnr === focusPnr,
        variant,
        tooltip: tooltipLines.join("\n"),
        onClick: () => {
          if (isMissing) return;
          setBreadcrumb(prev => [...prev, focusPnr]);
          navigate(`/relations?person=${pnr}`);
        },
      };

      return {
        id: pnr,
        type: "person",
        position: { x, y },
        data: data as any,
        draggable: false,
      };
    }

    // Helper: lay out a row centered at centerX (centerX = midpoint of the row)
    function layoutRow(pnrs: string[], centerX: number, y: number, variant: PersonNodeData["variant"]) {
      const totalW = pnrs.length * NODE_W + Math.max(0, pnrs.length - 1) * H_GAP;
      const startX = centerX - totalW / 2;
      pnrs.forEach((pnr, i) => {
        if (newNodes.find(n => n.id === pnr)) return;
        newNodes.push(makeNode(pnr, startX + i * (NODE_W + H_GAP), y, variant));
      });
    }

    const Y_GP = 0;
    const Y_PARENT = V_GAP;
    const Y_FOCUS = V_GAP * 2;
    const Y_CHILD = V_GAP * 3;
    const Y_GC = V_GAP * 4;

    // focusCenterX = X coordinate of the CENTER of the focus node
    const focusCenterX = 0;
    const focusLeftX = focusCenterX - NODE_W / 2;

    const siblings = Array.from(siblingMap.keys());
    const partnersArr = Array.from(partners);

    // Place focus
    newNodes.push(makeNode(focusPnr, focusLeftX, Y_FOCUS, "focus"));

    // Siblings to the left of focus
    siblings.forEach((s, i) => {
      const x = focusLeftX - (NODE_W + H_GAP) * (siblings.length - i);
      newNodes.push(makeNode(s, x, Y_FOCUS, "sibling"));
    });

    // Partners to the right of focus
    partnersArr.forEach((p, i) => {
      const x = focusLeftX + (NODE_W + H_GAP) * (i + 1);
      newNodes.push(makeNode(p, x, Y_FOCUS, "partner"));
      newEdges.push({
        id: `partner-${focusPnr}-${p}`,
        source: focusPnr,
        target: p,
        type: "straight",
        style: { stroke: "#e11d48", strokeWidth: 3 },
        label: "❤",
        labelStyle: { fontSize: 14 },
        labelBgStyle: { fill: "hsl(var(--background))" },
      });
    });

    // Parents row: centered above focus
    const parentsArr = Array.from(parents);
    layoutRow(parentsArr, focusCenterX, Y_PARENT, "parent");
    // edges parent -> focus + parent -> siblings
    parentsArr.forEach(par => {
      const isGuardian = guardiansOnly.has(par);
      const childPnrs = [focusPnr, ...siblings.filter(s => siblingMap.get(s)?.has(par))];
      childPnrs.forEach(child => {
        newEdges.push({
          id: `parent-${par}-${child}`,
          source: par,
          target: child,
          type: "smoothstep",
          style: {
            stroke: isGuardian ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
            strokeWidth: 1.5,
            strokeDasharray: isGuardian ? "5 5" : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isGuardian ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" },
          label: isGuardian ? "vårdnad" : undefined,
          labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
          labelBgStyle: { fill: "hsl(var(--background))" },
        });
      });
    });

    // Sibling line (subtle horizontal indicator between siblings)
    siblings.forEach(s => {
      const sharedWithFocus = siblingMap.get(s)!;
      const fullSibling = parentsArr.length >= 2 && parentsArr.every(p => sharedWithFocus.has(p));
      newEdges.push({
        id: `sibling-${s}-${focusPnr}`,
        source: s,
        target: focusPnr,
        type: "straight",
        style: {
          stroke: "hsl(var(--muted-foreground))",
          strokeWidth: 1,
          strokeDasharray: fullSibling ? undefined : "4 3",
          opacity: 0.4,
        },
      });
    });

    // Grandparents row: center above parents (split by which parent if known)
    const gpList = Array.from(grandparents.keys());
    layoutRow(gpList, focusCenterX, Y_GP, "grandparent");
    gpList.forEach(gp => {
      grandparents.get(gp)!.forEach(par => {
        newEdges.push({
          id: `gp-${gp}-${par}`,
          source: gp,
          target: par,
          type: "smoothstep",
          style: { stroke: "hsl(var(--foreground))", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--foreground))" },
        });
      });
    });

    // Children row: centered between focus and (first) partner
    const childrenArr = Array.from(children);
    const childCenter = partnersArr.length > 0
      ? (focusCenterX + (focusCenterX + (NODE_W + H_GAP))) / 2
      : focusCenterX;
    layoutRow(childrenArr, childCenter, Y_CHILD, "child");
    childrenArr.forEach(ch => {
      newEdges.push({
        id: `child-${focusPnr}-${ch}`,
        source: focusPnr,
        target: ch,
        type: "smoothstep",
        style: { stroke: "hsl(var(--foreground))", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--foreground))" },
      });
    });

    // Grandchildren row
    const gcList = Array.from(grandchildren.keys());
    layoutRow(gcList, childCenter, Y_GC, "grandchild");
    gcList.forEach(gc => {
      grandchildren.get(gc)!.forEach(ch => {
        newEdges.push({
          id: `gc-${ch}-${gc}`,
          source: ch,
          target: gc,
          type: "smoothstep",
          style: { stroke: "hsl(var(--foreground))", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--foreground))" },
        });
      });
    });

    // AfbRelation extra nodes - place to the side at parent level if parent-like, else focus level
    afbRels.forEach((ar, i) => {
      const id = `afb-${ar.id}`;
      const t = ar.rel_typ.toUpperCase();
      const isParent = PARENT_TYPES.includes(t);
      const y = isParent ? Y_PARENT : (t === "B" ? Y_CHILD : Y_FOCUS);
      const x = focusCenterX + (NODE_W + H_GAP) * (partnersArr.length + 2 + i);
      const name = [ar.afb_rel_fnamn, ar.afb_rel_mnamn, ar.afb_rel_enamn].filter(Boolean).join(" ").trim() || "Okänd";
      const pnd: PersonNodeData = {
        name,
        pnr: "—",
        gender: null,
        birthYear: ar.afb_rel_fodtid ? ar.afb_rel_fodtid.slice(0, 4) : null,
        deceased: false,
        isFocus: false,
        variant: "missing-afb",
        tooltip: `${name}\nUtländsk anhörig\nRelation: ${RELATION_TYPE_DESCRIPTIONS[t] || t}`,
      };
      newNodes.push({ id, type: "person", position: { x, y }, data: pnd as any, draggable: false });
      const isUp = isParent;
      newEdges.push({
        id: `afb-edge-${ar.id}`,
        source: isUp ? id : focusPnr,
        target: isUp ? focusPnr : id,
        type: "smoothstep",
        style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.2, strokeDasharray: "4 3", opacity: 0.7 },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [navigate, setNodes, setEdges]);

  useEffect(() => {
    if (personPnr) {
      buildTree(personPnr);
    } else {
      // Default to a sample person? Just show empty state.
      setNodes([]);
      setEdges([]);
      setLoading(false);
    }
  }, [personPnr, buildTree, setNodes, setEdges]);

  const handleNodeClick = useCallback(async (_: any, node: Node) => {
    const data = node.data as PersonNodeData;
    if (data.variant === "missing-fb" || data.variant === "missing-afb") return;
    const person = personByPnr.get(node.id);
    if (person) setSelectedPerson(person);
  }, [personByPnr]);

  const focusPnr = personPnr;

  // Build relation summary for info panel
  const relationGroups = useMemo(() => {
    if (!selectedPerson) return [];
    const map = new Map<string, { otherPnr: string; labels: Set<string>; types: Set<string> }>();
    for (const r of selectedPersonRelations) {
      if (isExcluded(r.rel_typ)) continue;
      const otherPnr = r.person_a === selectedPerson.pnr ? r.person_b : r.person_a;
      if (!otherPnr || otherPnr === selectedPerson.pnr) continue;
      if (!map.has(otherPnr)) map.set(otherPnr, { otherPnr, labels: new Set(), types: new Set() });
      const desc = getRelationDescription(r.rel_typ) || r.relation_label || r.rel_typ;
      if (desc) map.get(otherPnr)!.labels.add(desc);
      if (r.rel_typ) map.get(otherPnr)!.types.add(r.rel_typ);
    }
    return Array.from(map.values());
  }, [selectedPerson, selectedPersonRelations]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Släktträd</h1>
            <p className="text-muted-foreground mt-1">
              {focusPnr
                ? "Klicka på en nod för att se information, klicka igen för att fokusera"
                : "Välj en person från Personregistret för att se släktträdet"}
            </p>
          </div>
          {focusPnr && (
            <Button variant="outline" onClick={() => navigate("/persons")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Tillbaka till personer
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-muted-foreground">Tidigare fokus:</span>
            {breadcrumb.map((pnr, i) => {
              const p = personByPnr.get(pnr);
              return (
                <button
                  key={i}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => {
                    setBreadcrumb(prev => prev.slice(0, i));
                    navigate(`/relations?person=${pnr}`);
                  }}
                >
                  {p ? fullName(p) : pnr}
                  <ChevronRight className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-4" style={{ height: "calc(100vh - 280px)" }}>
          {/* Graph */}
          <div className="flex-1 rounded-lg border bg-card overflow-hidden relative">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <GitFork className="h-8 w-8 mx-auto animate-pulse" />
                  <p>Laddar släktträd...</p>
                </div>
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <GitFork className="h-12 w-12 mx-auto opacity-30" />
                  <p>Ingen person vald</p>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="hsl(var(--border))" gap={20} size={1} />
                <Controls showInteractive={false} style={{ bottom: 20, left: 20 }} />

                {/* Generation guide labels */}
                <Panel position="top-left">
                  <div className="text-[10px] text-muted-foreground space-y-1 pointer-events-none">
                    <div>Gen +2 · Far/morföräldrar</div>
                    <div style={{ marginTop: 110 }}>Gen +1 · Föräldrar</div>
                    <div style={{ marginTop: 110 }}>Gen 0 · Personen själv</div>
                    <div style={{ marginTop: 110 }}>Gen −1 · Barn</div>
                    <div style={{ marginTop: 110 }}>Gen −2 · Barnbarn</div>
                  </div>
                </Panel>

                <Panel position="top-right">
                  <div className="flex gap-1.5 flex-wrap text-[11px] max-w-md justify-end">
                    {[
                      { label: "Partner", color: "#e11d48" },
                      { label: "Förälder/Barn", color: "hsl(var(--foreground))" },
                      { label: "Syskon (härlett)", color: "hsl(var(--muted-foreground))", dashed: true },
                      { label: "Vårdnadshavare", color: "hsl(var(--muted-foreground))", dashed: true },
                      { label: "Avliden †", color: "hsl(var(--foreground))" },
                    ].map((item) => (
                      <span key={item.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/90 border">
                        <span
                          className="inline-block w-3 h-0.5"
                          style={{
                            backgroundColor: item.color,
                            borderTop: item.dashed ? `1px dashed ${item.color}` : undefined,
                            backgroundImage: item.dashed ? `repeating-linear-gradient(90deg, ${item.color} 0 3px, transparent 3px 6px)` : undefined,
                            background: item.dashed ? undefined : item.color,
                          }}
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
                    <User className="h-4 w-4" /> Personinformation
                  </CardTitle>
                  <button onClick={() => setSelectedPerson(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{fullName(selectedPerson)}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedPerson.pnr}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {selectedPerson.booked_to_region_stockholm && (
                      <Badge variant="default" className="text-xs">Bokad RS</Badge>
                    )}
                    {selectedPerson.hsaid && (
                      <Badge variant="secondary" className="text-xs">HSA: {selectedPerson.hsaid}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <InfoRow label="Kön" value={selectedPerson.gender === "K" ? "Kvinna" : selectedPerson.gender === "M" ? "Man" : null} />
                  <InfoRow label="Kommun" value={selectedPerson.municipality} />
                  <InfoRow label="Län" value={selectedPerson.county} />
                  {(selectedPerson.fb_address1 || selectedPerson.fb_postort) && (
                    <div className="pt-2 border-t">
                      <div className="flex items-start gap-2 text-muted-foreground mb-1">
                        <MapPin className="h-3.5 w-3.5 mt-0.5" />
                        <span className="text-xs font-medium uppercase tracking-wider">Adress</span>
                      </div>
                      {selectedPerson.fb_address1 && <p className="text-sm ml-5">{selectedPerson.fb_address1}</p>}
                      {(selectedPerson.fb_postnr || selectedPerson.fb_postort) && (
                        <p className="text-sm ml-5">{selectedPerson.fb_postnr} {selectedPerson.fb_postort}</p>
                      )}
                    </div>
                  )}
                </div>

                {relationGroups.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Relationer</h4>
                    <div className="space-y-2">
                      {relationGroups.map(({ otherPnr, labels }) => {
                        const other = personByPnr.get(otherPnr);
                        const name = other ? fullName(other) : null;
                        return (
                          <button
                            key={otherPnr}
                            className="w-full text-left rounded-lg border p-2.5 hover:bg-accent/30 transition-colors"
                            onClick={() => {
                              if (focusPnr) setBreadcrumb(prev => [...prev, focusPnr]);
                              navigate(`/relations?person=${otherPnr}`);
                            }}
                          >
                            <p className="text-sm font-semibold truncate">
                              {name || <span className="text-muted-foreground italic">Person ej i datasetet</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">{otherPnr}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {Array.from(labels).map(label => (
                                <Badge key={label} variant="outline" className="text-[10px]">{label}</Badge>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedPerson.pnr !== focusPnr && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        if (focusPnr) setBreadcrumb(prev => [...prev, focusPnr]);
                        navigate(`/relations?person=${selectedPerson.pnr}`);
                      }}
                    >
                      <GitFork className="h-4 w-4" /> Visa släktträd för denna person
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
