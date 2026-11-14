import { z } from "zod";
import { getLLM, type LLMProvider } from "@/lib/adapters/llm";
import { planPrompt } from "@/lib/ai/prompts/plan";
import { systemPrompt } from "@/lib/ai/prompts/system";
import { writePrompt, type Slot } from "@/lib/ai/prompts/write";
import { festivalsFor } from "@/lib/festivals";
import { seedScript } from "@/lib/seed-posts";
import { FAMILY_IDS } from "@/lib/templates/schema";
import type { BusinessBundle, GenerationSpeed, Post } from "@/lib/types";
import { checkFacts } from "./fact-guard";
import { countDuplicatePairs, isDuplicate } from "./dedupe";

export type StepId = "reading" | "mapping" | "balancing" | "writing" | "designing";

export interface GenerationSummary {
  posts: number;
  pillars: number;
  festivals: number;
  duplicates: number;
  needReview: number;
}

export type GenEvent =
  | { type: "step"; id: StepId; status: "active" | "done" }
  | { type: "post"; post: Post; index: number; total: number }
  | { type: "notice"; message: string }
  | { type: "done"; summary: GenerationSummary };

const LIVE_BUDGET_MS = 60_000;

const planSchema = z.object({
  slots: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    pillarId: z.string(),
    format: z.enum(["image", "carousel", "reel"]),
    ideaTitle: z.string(),
    festivalId: z.string().optional(),
  })).min(1),
});

const writeSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()),
  cta: z.string(),
  visualBrief: z.string(),
  templateId: z.enum(FAMILY_IDS),
  headline: z.string(),
  subhead: z.string().optional(),
  body: z.string().optional(),
  badge: z.string().optional(),
  slides: z.array(z.object({ title: z.string(), body: z.string() })).max(5).optional(),
});

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function summarise(posts: Post[]): GenerationSummary {
  return {
    posts: posts.length,
    pillars: new Set(posts.map((p) => p.pillarId)).size,
    festivals: new Set(posts.map((p) => p.festivalId).filter(Boolean)).size,
    duplicates: countDuplicatePairs(posts.map((p) => p.title)),
    needReview: posts.filter((p) => p.factFlags.some((f) => f.status === "warn")).length,
  };
}

async function* streamSeed(seed: Post[], speed: GenerationSpeed): AsyncGenerator<GenEvent> {
  const fast = speed === "fast";
  const stepMs = fast ? 250 : 1000;
  for (const id of ["reading", "mapping", "balancing"] as const) {
    yield { type: "step", id, status: "active" };
    await sleep(stepMs);
    yield { type: "step", id, status: "done" };
  }
  yield { type: "step", id: "writing", status: "active" };
  const designAt = Math.floor(seed.length * 0.7);
  for (const [i, post] of seed.entries()) {
    // 2.5–4 s per post in realistic mode (about 55 s total); 0.5–0.9 s when fast.
    await sleep(fast ? 500 + Math.random() * 400 : 2500 + Math.random() * 1500);
    if (i === designAt) {
      yield { type: "step", id: "writing", status: "done" };
      yield { type: "step", id: "designing", status: "active" };
    }
    yield { type: "post", post, index: i + 1, total: seed.length };
  }
  if (designAt >= seed.length) yield { type: "step", id: "writing", status: "done" };
  yield { type: "step", id: "designing", status: "done" };
}

async function askJson<T>(llm: LLMProvider, system: string, user: string, schema: z.ZodType<T>, timeoutMs: number): Promise<T> {
  let prompt = user;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await llm.completeJson(system, prompt, timeoutMs);
    try {
      return schema.parse(JSON.parse(raw));
    } catch (err) {
      // One retry with the validation error appended, then the caller falls back to seed.
      prompt = `${user}\n\nYour previous answer was invalid: ${err instanceof Error ? err.message : "bad JSON"}. Return corrected JSON only.`;
    }
  }
  throw new Error("LLM output failed validation");
}

function slotToPost(bundle: BusinessBundle, slot: Slot, w: z.infer<typeof writeSchema>, n: number): Post {
  const now = new Date().toISOString();
  return {
    id: `${bundle.business.id}-${slot.date.replace(/-/g, "")}-g${n}`,
    businessId: bundle.business.id,
    pillarId: slot.pillarId,
    format: slot.format,
    title: slot.ideaTitle,
    caption: w.caption,
    hashtags: w.hashtags,
    cta: w.cta,
    visualBrief: w.visualBrief,
    templateId: w.templateId,
    templateProps: { headline: w.headline, subhead: w.subhead, body: w.body, badge: w.badge, slides: w.slides, cta: w.cta },
    photoTags: [],
    scheduledAt: `${slot.date}T${n % 2 ? "11:00" : "19:30"}:00+05:30`,
    status: "draft",
    platforms: ["instagram", "facebook"],
    variant: 0,
    watermark: true,
    factConfirmed: [],
    timeline: [],
    factFlags: checkFacts(`${w.caption}\n${w.cta}`, bundle),
    ...(slot.festivalId ? { festivalId: slot.festivalId } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

async function* streamLive(bundle: BusinessBundle, month: string, seed: Post[], existingTitles: string[]): AsyncGenerator<GenEvent> {
  const llm = getLLM();
  if (!llm) {
    yield { type: "notice", message: "Live generation is not configured, using the prepared calendar." };
    yield* streamSeed(seed, "fast");
    yield { type: "done", summary: summarise(seed) };
    return;
  }
  const started = Date.now();
  const remaining = () => LIVE_BUDGET_MS - (Date.now() - started);
  const system = systemPrompt(bundle.business, bundle.brandKit);
  const festivals = festivalsFor(bundle.business.type).filter((f) => f.date.startsWith(month));

  yield { type: "step", id: "reading", status: "active" };
  yield { type: "step", id: "reading", status: "done" };
  yield { type: "step", id: "mapping", status: "active" };
  yield { type: "step", id: "mapping", status: "done" };
  yield { type: "step", id: "balancing", status: "active" };

  let slots: Slot[];
  try {
    const plan = await askJson(llm, system, planPrompt({ month, count: Math.min(18, Math.max(12, seed.length || 18)), pillars: bundle.pillars, festivals, existingTitles }), planSchema, Math.max(5000, remaining()));
    slots = plan.slots.filter((s) => s.date.startsWith(month));
  } catch {
    yield { type: "notice", message: "The AI took too long, so we used the prepared calendar." };
    yield { type: "step", id: "balancing", status: "done" };
    yield* streamSeed(seed, "fast");
    yield { type: "done", summary: summarise(seed) };
    return;
  }
  yield { type: "step", id: "balancing", status: "done" };
  yield { type: "step", id: "writing", status: "active" };

  const titles = [...existingTitles];
  const tags = bundle.brandKit.hashtagSets.flatMap((h) => h.tags);
  const out: Post[] = [];
  let fellBack = false;
  for (const [i, slot] of slots.entries()) {
    const fallback = seed[i];
    let post: Post | undefined;
    if (!isDuplicate(slot.ideaTitle, titles) && remaining() > 3000) {
      try {
        const written = await askJson(llm, system, writePrompt(slot, tags, bundle.brandKit.cta), writeSchema, Math.min(20_000, remaining()));
        post = slotToPost(bundle, slot, written, i + 1);
      } catch {
        post = undefined;
      }
    }
    if (!post && fallback) {
      fellBack = true;
      post = fallback;
    }
    if (!post) continue;
    titles.push(post.title);
    out.push(post);
    yield { type: "post", post, index: out.length, total: slots.length };
  }
  if (fellBack) yield { type: "notice", message: "Some posts used the prepared calendar as a safety net." };
  yield { type: "step", id: "writing", status: "done" };
  yield { type: "step", id: "designing", status: "active" };
  yield { type: "step", id: "designing", status: "done" };
  yield { type: "done", summary: summarise(out) };
}

export async function* generateCalendar(input: {
  bundle: BusinessBundle;
  month: string;
  mode: "demo" | "live";
  speed: GenerationSpeed;
  existingTitles: string[];
}): AsyncGenerator<GenEvent> {
  const { bundle, month, mode, speed, existingTitles } = input;
  const seed = seedScript(bundle.business.id, month);
  if (mode === "live") {
    yield* streamLive(bundle, month, seed, existingTitles);
    return;
  }
  for await (const event of streamSeed(seed, speed)) yield event;
  yield { type: "done", summary: summarise(seed) };
}
