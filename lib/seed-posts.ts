import { z } from "zod";
import svNov from "@/data/seed/calendars/shubh-vivah-2026-11.json";
import svDec from "@/data/seed/calendars/shubh-vivah-2026-12.json";
import ccDec from "@/data/seed/calendars/chai-chapter-2026-12.json";
import ffDec from "@/data/seed/calendars/forge-fitness-2026-12.json";
import { postSchema } from "./schemas";
import type { Post } from "./types";

const parse = (data: unknown): Post[] => z.array(postSchema).parse(data);

/** Posts present when the demo starts (already-running November). */
export function initialPosts(): Record<string, Post> {
  return Object.fromEntries(parse(svNov).map((p) => [p.id, p]));
}

const SCRIPTS: Record<string, Post[]> = {
  "shubh-vivah:2026-12": parse(svDec),
  "chai-chapter:2026-12": parse(ccDec),
  "forge-fitness:2026-12": parse(ffDec),
};

/** The pre-generated calendar: demo-mode streaming source and the live-mode safety net. */
export function seedScript(businessId: string, month: string): Post[] {
  return SCRIPTS[`${businessId}:${month}`] ?? [];
}
