function parse(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = parse(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  return toHex([
    pa[0] + (pb[0] - pa[0]) * t,
    pa[1] + (pb[1] - pa[1]) * t,
    pa[2] + (pb[2] - pa[2]) * t,
  ]);
}

/** Nudges `colour` toward white or black until it reaches AA contrast (4.5) against `background`. */
export function ensureContrast(colour: string, background: string): string {
  const target = luminance(background) < 0.4 ? "#FFFFFF" : "#000000";
  let result = colour;
  for (let t = 0; t <= 1 && contrastRatio(result, background) < 4.5; t += 0.05) {
    result = mix(colour, target, t);
  }
  return result;
}

/** Black or white, whichever reads better on `background`. */
export function readableOn(background: string): string {
  return contrastRatio("#FFFFFF", background) >= contrastRatio("#0B0B10", background)
    ? "#FFFFFF"
    : "#0B0B10";
}

function saturation(hex: string): number {
  const [r, g, b] = parse(hex).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}

/** Picks the UI accent from the brand colours: the more vivid one on dark panels, the primary on light. */
export function pickAccent(primary: string, secondary: string, dark: boolean): string {
  if (!dark) return primary;
  return saturation(secondary) > saturation(primary) ? secondary : primary;
}
