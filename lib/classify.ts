// Simple keyword-scoring complaint classifier (runs in the browser and in the data generator).
export const THEMES = [
  "delivery expectations",
  "follow-up",
  "pricing communication",
  "finance explanation",
  "service",
  "product knowledge",
  "communication",
] as const;

export const KEYWORDS: Record<string, string[]> = {
  "delivery expectations": ["delivery", "two weeks", "four weeks", "slipped", "delivery date"],
  "follow-up": ["follow-up", "no one called", "chase", "after i bought", "documents"],
  "pricing communication": ["price", "add-ons", "accessor", "quoted", "upgrades", "billing", "pushed"],
  "finance explanation": ["emi", "loan", "interest", "processing", "charges"],
  service: ["service", "workshop", "fault", "appointment"],
  "product knowledge": ["explain the", "battery", "variant", "features", "conflicting", "incorrectly"],
  communication: ["unanswered", "calls", "messages", "different staff", "information"],
};

export function classify(text: string): { theme: string; matched: string[] } {
  const t = text.toLowerCase();
  let best = "communication";
  let bestHits: string[] = [];
  for (const theme of THEMES) {
    const hits = KEYWORDS[theme].filter((k) => t.includes(k));
    if (hits.length > bestHits.length) {
      best = theme;
      bestHits = hits;
    }
  }
  return { theme: best, matched: bestHits };
}
