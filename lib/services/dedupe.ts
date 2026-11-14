function tokens(title: string): Set<string> {
  return new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2));
}

/** Token-set (Jaccard) similarity of two idea titles, 0 to 1. */
export function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / (ta.size + tb.size - shared);
}

export const DUPLICATE_THRESHOLD = 0.6;

export function isDuplicate(title: string, existing: string[]): boolean {
  return existing.some((e) => similarity(title, e) > DUPLICATE_THRESHOLD);
}

export function countDuplicatePairs(titles: string[]): number {
  let pairs = 0;
  for (let i = 0; i < titles.length; i += 1) {
    for (let j = i + 1; j < titles.length; j += 1) {
      if (similarity(titles[i] as string, titles[j] as string) > DUPLICATE_THRESHOLD) pairs += 1;
    }
  }
  return pairs;
}
