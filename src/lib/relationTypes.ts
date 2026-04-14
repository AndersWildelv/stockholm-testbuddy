export const RELATION_TYPE_DESCRIPTIONS: Record<string, string> = {
  "M": "Make/Maka – Gift med",
  "B": "Barn",
  "FA": "Far – Förälder (far)",
  "MO": "Mor – Förälder (mor)",
  "F": "Förälder",
  "P": "Partner",
  "V": "Vårdnadshavare",
  "VF": "Vårdnadshavare Far",
  "SY": "Syskon",
};

export function getRelationDescription(code: string | null | undefined): string | null {
  if (!code) return null;
  return RELATION_TYPE_DESCRIPTIONS[code.toUpperCase()] || RELATION_TYPE_DESCRIPTIONS[code] || null;
}
