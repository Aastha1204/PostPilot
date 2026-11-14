import sharp from "sharp";
import { hasSupabase } from "@/lib/config";
import { getStorage } from "./storage";
import type { PostTheme } from "@/lib/themes";

export interface ImageRequest {
  prompt: string;
  theme: PostTheme;
  /** Used for file names and to vary the demo artwork. */
  seed: string;
  index: number;
}

export interface ImageProvider {
  readonly name: "openai" | "free" | "mock";
  /** Returns a URL or data URL for a 4:5 (1080×1350) JPEG. */
  generate(req: ImageRequest): Promise<string>;
}

const W = 1080;
const H = 1350;

function rngFrom(seed: string) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Original theme artwork for demo mode, so every theme looks different without an API key. */
function themeArt(req: ImageRequest): string {
  const { theme, index } = req;
  const { bg, fg, accent, primary, secondary } = theme.palette;
  const r = rngFrom(`${req.seed}-${index}`);
  const dark = parseInt(bg.slice(1), 16) < 0x808080;
  const base = dark ? bg : primary;
  const shapes: string[] = [];
  const n = 26;
  for (let i = 0; i < n; i += 1) {
    const x = r() * W;
    const y = r() * H;
    const size = 30 + r() * 150;
    const col = [accent, secondary, fg, primary][Math.floor(r() * 4)]!;
    const o = (0.12 + r() * 0.35).toFixed(2);
    switch (theme.motif) {
      case "rings":
        shapes.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="none" stroke="${col}" stroke-width="${2 + r() * 5}" opacity="${o}"/>`);
        break;
      case "rays":
        shapes.push(`<polygon points="${W / 2},${H * 0.85} ${x - size},${y - size * 3} ${x + size},${y - size * 3}" fill="${col}" opacity="${(Number(o) * 0.5).toFixed(2)}"/>`);
        break;
      case "waves":
        shapes.push(`<path d="M0 ${y} Q ${W / 4} ${y - size} ${W / 2} ${y} T ${W} ${y}" fill="none" stroke="${col}" stroke-width="${3 + r() * 8}" opacity="${o}"/>`);
        break;
      case "confetti":
        shapes.push(`<rect x="${x}" y="${y}" width="${size * 0.5}" height="${size * 0.2}" rx="6" fill="${col}" opacity="${(Number(o) + 0.25).toFixed(2)}" transform="rotate(${Math.floor(r() * 180)} ${x} ${y})"/>`);
        break;
      case "petals":
        shapes.push(`<ellipse cx="${x}" cy="${y}" rx="${size * 0.5}" ry="${size}" fill="${col}" opacity="${o}" transform="rotate(${Math.floor(r() * 180)} ${x} ${y})"/>`);
        break;
      default:
        shapes.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="${col}" opacity="${(Number(o) * 0.7).toFixed(2)}" filter="url(#b)"/>`);
    }
  }
  const gx = 200 + r() * 680;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><filter id="b"><feGaussianBlur stdDeviation="14"/></filter>
<radialGradient id="g" cx="${gx / W}" cy="${0.25 + r() * 0.3}" r="0.85"><stop offset="0" stop-color="${accent}" stop-opacity="0.65"/><stop offset="1" stop-color="${base}"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>${shapes.join("")}
<circle cx="${W / 2}" cy="${H * 0.42}" r="${150 + index * 14}" fill="none" stroke="${fg}" stroke-opacity="0.35" stroke-width="3"/>
<circle cx="${W / 2}" cy="${H * 0.42}" r="${90 + index * 10}" fill="${accent}" fill-opacity="0.22"/></svg>`;
}

async function toDataUrl(input: Buffer): Promise<string> {
  const jpeg = await sharp(input).resize(W, H, { fit: "cover" }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

class MockImages implements ImageProvider {
  readonly name = "mock" as const;
  async generate(req: ImageRequest): Promise<string> {
    return toDataUrl(Buffer.from(themeArt(req)));
  }
}

/** OpenAI Images API (gpt-image-1 by default). Falls back to the caller's mock on any failure. */
const g = globalThis as typeof globalThis & { __ppOpenAIOffUntil?: number };

class OpenAIImages implements ImageProvider {
  readonly name = "openai" as const;
  private readonly model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  async generate(req: ImageRequest): Promise<string> {
    // After an out-of-credit or rate-limit answer, skip OpenAI for ten minutes instead of failing every image.
    if ((g.__ppOpenAIOffUntil ?? 0) > Date.now()) throw new Error("OpenAI paused");
    const dalle = this.model.startsWith("dall-e");
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: req.prompt,
        n: 1,
        size: dalle ? "1024x1792" : "1024x1536",
        ...(dalle ? { response_format: "b64_json" } : { quality: "medium" }),
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      if (res.status === 429 || res.status === 401) g.__ppOpenAIOffUntil = Date.now() + 10 * 60_000;
      throw new Error(`OpenAI image ${res.status}`);
    }
    const b64 = ((await res.json()) as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image");
    const dataUrl = await toDataUrl(Buffer.from(b64, "base64"));
    if (hasSupabase()) {
      // Store the full image publicly (Instagram needs a public URL); keep the post light.
      const bytes = Buffer.from(dataUrl.split(",")[1]!, "base64");
      return getStorage(true).upload(`generated/${req.seed}-${req.index}.jpg`, bytes, "image/jpeg");
    }
    return dataUrl;
  }
}

/** Free text-to-image via Pollinations (no key, no credits). Only the image description is sent. */
class FreeImages implements ImageProvider {
  readonly name = "free" as const;
  async generate(req: ImageRequest): Promise<string> {
    const seed = Math.abs([...req.seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, req.index * 977));
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.prompt.slice(0, 900))}?width=1024&height=1280&nologo=true&model=flux&seed=${seed}`;
    let lastStatus = 0;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 3000 * attempt));
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
        lastStatus = res.status;
        if (res.ok && (res.headers.get("content-type") ?? "").startsWith("image/")) return toDataUrl(Buffer.from(await res.arrayBuffer()));
      } catch {
        lastStatus = 0;
      }
    }
    throw new Error(`Free image service ${lastStatus}`);
  }
}

/** Tries each provider in order, so a missing key, no credits or an outage never stops a post. */
class ChainImages implements ImageProvider {
  constructor(private readonly chain: ImageProvider[]) {}
  get name() {
    return this.chain[0]!.name;
  }
  async generate(req: ImageRequest): Promise<string> {
    let last: unknown;
    for (const p of this.chain) {
      try {
        const url = await p.generate(req);
        used.add(p.name);
        return url;
      } catch (e) {
        last = e;
      }
    }
    throw last instanceof Error ? last : new Error("No image provider answered");
  }
}

const used = new Set<ImageProvider["name"]>();
/** Which engines actually produced images since the last call (read once per request). */
export function takeUsedProviders(): ImageProvider["name"][] {
  const list = [...used];
  used.clear();
  return list;
}

export function openaiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getImageProvider(useAI: boolean): ImageProvider {
  if (!useAI) return new MockImages();
  const chain: ImageProvider[] = [];
  if (openaiConfigured()) chain.push(new OpenAIImages());
  if (process.env.FREE_IMAGES !== "false") chain.push(new FreeImages());
  return chain.length ? new ChainImages(chain) : new MockImages();
}

export { MockImages };
