import { z } from "zod";
import { getLLM } from "@/lib/adapters/llm";
import { EDIT_ACTIONS, editPrompt, type EditAction } from "@/lib/ai/prompts/edit";
import { systemPrompt } from "@/lib/ai/prompts/system";
import type { BusinessBundle } from "@/lib/types";
import { wordDiff, type DiffOp } from "@/lib/utils/diff";
import { checkFacts } from "./fact-guard";

export interface EditablePost {
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface EditResult {
  revised: EditablePost;
  summary: string;
  diff: DiffOp[];
  newWarnings: string[];
  source: "live" | "demo";
}

const llmSchema = z.object({ caption: z.string().min(1), hashtags: z.array(z.string()), cta: z.string(), summary: z.string() });

const EMOJI = /[\p{Extended_Pictographic}‍️]/gu;

const HINGLISH: [RegExp, string][] = [
  [/\bBehind the scenes\b/gi, "Parde ke peeche"],
  [/\bBook\b/g, "Book karein"],
  [/\bReal setup\b/gi, "Ek asli setup"],
  [/\bSwipe\b/g, "Swipe karke dekhiye"],
  [/\byour\b/gi, "aapka"],
  [/\bperfect\b/gi, "ekdum perfect"],
  [/\bbeautiful\b/gi, "khoobsurat"],
];

/** Deterministic stand-in used in demo mode and as the fallback when the LLM fails. */
function mockEdit(post: EditablePost, instruction: string, unverified: string[]): { revised: EditablePost; summary: string } {
  const text = instruction.toLowerCase();
  const lines = post.caption.split("\n");
  const cta = post.cta.trim();
  const isCtaLine = (l: string) => cta !== "" && l.trim() === cta;
  let caption = post.caption;
  const steps: string[] = [];

  if (/short|chhota|chota|kam shabd|trim/.test(text)) {
    const body = lines.filter((l) => !isCtaLine(l));
    const kept = [body[0], body[1]].filter((l): l is string => Boolean(l));
    caption = [...kept, ...lines.filter(isCtaLine)].join("\n");
    steps.push("trimmed to the hook, one detail line and the CTA");
  }
  if (/emoji kam|fewer emoji|no emoji|less emoji|bina emoji/.test(text)) {
    caption = caption.replace(EMOJI, "").replace(/ +\n/g, "\n").replace(/ {2,}/g, " ").trim();
    steps.push("removed emoji");
  }
  if (/festive|tyohaar|celebrat/.test(text)) {
    const [hook = "", ...rest] = caption.split("\n");
    caption = [`${hook.replace(/\s*$/, "")} 🪔`, ...rest].join("\n");
    steps.push("added a festive touch");
  }
  if (/hinglish|hindi/.test(text)) {
    caption = HINGLISH.reduce((c, [re, to]) => c.replace(re, to), caption);
    steps.push("leaned into Hinglish");
  }
  if (/formal|professional|polished/.test(text)) {
    caption = caption.replace(EMOJI, "").replace(/!+/g, ".").replace(/ {2,}/g, " ").trim();
    steps.push("made the tone more formal");
  }
  if (/hata|remove|delete|nikal|wrong|galat/.test(text) && unverified.length) {
    const kept = caption.split("\n").filter((l) => !unverified.some((u) => l.includes(u)));
    if (kept.length < caption.split("\n").length) {
      caption = kept.join("\n");
      steps.push("removed the detail that is not in the brand kit");
    }
  }
  if (steps.length === 0) return { revised: post, summary: "No change. Try \"shorter\", \"fewer emoji\", \"more festive\", \"more Hinglish\" or \"more formal\"." };
  return { revised: { ...post, caption }, summary: `Updated: ${steps.join(", ")}.` };
}

export async function editPost(input: { bundle: BusinessBundle; post: EditablePost; instruction?: string; action?: EditAction; live: boolean }): Promise<EditResult> {
  const { bundle, post, live } = input;
  const instruction = input.instruction?.trim() || (input.action ? EDIT_ACTIONS[input.action] : "");
  const unverified = checkFacts(post.caption, bundle).filter((f) => f.status === "warn").map((f) => f.text);
  let result: { revised: EditablePost; summary: string };
  let source: EditResult["source"] = "demo";

  const llm = live ? getLLM() : null;
  if (llm) {
    try {
      const raw = await llm.completeJson(systemPrompt(bundle.business, bundle.brandKit), editPrompt(post, instruction), 20_000);
      const parsed = llmSchema.parse(JSON.parse(raw));
      result = { revised: { caption: parsed.caption, hashtags: parsed.hashtags, cta: parsed.cta }, summary: parsed.summary };
      source = "live";
    } catch {
      result = mockEdit(post, instruction, unverified);
    }
  } else {
    result = mockEdit(post, instruction, unverified);
  }

  const before = new Set(checkFacts(post.caption, bundle).map((f) => f.text));
  const newWarnings = checkFacts(result.revised.caption, bundle)
    .filter((f) => f.status === "warn" && !before.has(f.text))
    .map((f) => f.text);
  return { ...result, diff: wordDiff(post.caption, result.revised.caption), newWarnings, source };
}
