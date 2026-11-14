import { NextResponse } from "next/server";
import { z } from "zod";
import { eventInputSchema } from "@/lib/events";
import { getBundle } from "@/lib/seed";
import { planEventPosts } from "@/lib/services/event-post";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  businessId: z.string(),
  event: eventInputSchema,
  themeId: z.string().optional(),
  imageCount: z.number().int().min(1).max(5).default(3),
  imageSource: z.enum(["ai", "mine", "mix"]).default("ai"),
  userPhotos: z.array(z.string().max(2_500_000)).max(6).default([]),
  postTime: z.string().regex(/^\d{2}:\d{2}$/).default("11:00"),
  teaser: z.boolean().default(false),
  autoApprove: z.boolean().default(false),
  platforms: z.array(z.enum(["instagram", "facebook", "linkedin", "x"])).min(1).default(["instagram", "facebook"]),
  useOpenAI: z.boolean().default(true),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { businessId, useOpenAI, ...rest } = parsed.data;
  const result = await planEventPosts({ bundle: getBundle(businessId), useOpenAI, ...rest });
  return NextResponse.json(result);
}
