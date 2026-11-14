/** Extracts up to `count` dominant colours from an image by bucketing pixels on a coarse grid. */
export async function extractPalette(file: File, count = 5): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Not an image"));
      i.src = url;
    });
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      if ((data[i + 3] ?? 0) < 200) continue; // ignore transparent pixels
      const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      e.n += 1; e.r += r; e.g += g; e.b += b;
      buckets.set(key, e);
    }
    const picked: { r: number; g: number; b: number }[] = [];
    for (const e of [...buckets.values()].sort((a, b) => b.n - a.n)) {
      const c = { r: e.r / e.n, g: e.g / e.n, b: e.b / e.n };
      // Skip colours too close to one already chosen so the chips are visibly different.
      if (picked.every((p) => Math.hypot(p.r - c.r, p.g - c.g, p.b - c.b) > 48)) picked.push(c);
      if (picked.length === count) break;
    }
    return picked.map((c) => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase());
  } finally {
    URL.revokeObjectURL(url);
  }
}
