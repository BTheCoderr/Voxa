/**
 * Heuristic extraction of "soft correction" lines from assistant text.
 * Aligns with Edge Function coaching style (Tiny tweak, Pronunciation, etc.).
 */
export function extractCorrectionSnippet(assistantText: string): string | null {
  const t = assistantText.trim();
  if (!t) return null;

  const patterns: RegExp[] = [
    /tiny tweak[:\s]+([^\n.]+(?:\.[^\n]+)?)/i,
    /quick fix[:\s]+([^\n.]+(?:\.[^\n]+)?)/i,
    /pronunciation[:\s]+([^\n.]+(?:\.[^\n]+)?)/i,
    /try saying[:\s]*([^\n.]+(?:\.[^\n]+)?)/i,
    /soft note[:\s]+([^\n.]+(?:\.[^\n]+)?)/i,
  ];

  for (const p of patterns) {
    const m = t.match(p);
    if (m?.[1]) {
      const s = m[1].trim();
      if (s.length > 2) return s.length > 220 ? `${s.slice(0, 217)}…` : s;
    }
  }

  return null;
}
