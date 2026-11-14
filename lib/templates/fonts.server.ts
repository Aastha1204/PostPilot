import { readFile } from "node:fs/promises";
import path from "node:path";
import { FONT_LIBRARY } from "./fonts";

export interface SatoriFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

const cache = new Map<string, Promise<SatoriFont[]>>();

function loadFamily(family: string): Promise<SatoriFont[]> {
  const entry = FONT_LIBRARY[family];
  if (!entry) return Promise.resolve([]);
  const hit = cache.get(family);
  if (hit) return hit;
  const promise = Promise.all(
    entry.weights.map(async (weight) => {
      const file = path.join(process.cwd(), "node_modules", "@fontsource", entry.pkg, "files", `${entry.pkg}-latin-${weight}-normal.woff`);
      return { name: family, data: await readFile(file), weight: weight as SatoriFont["weight"], style: "normal" as const };
    }),
  ).catch(() => [] as SatoriFont[]); // Missing font file: Satori falls back to its default face.
  cache.set(family, promise);
  return promise;
}

export async function loadFonts(families: string[]): Promise<SatoriFont[]> {
  const unique = [...new Set(families)];
  return (await Promise.all(unique.map(loadFamily))).flat();
}
