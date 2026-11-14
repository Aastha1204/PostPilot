import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config";
import { postSchema } from "@/lib/schemas";
import { publishPost } from "@/lib/services/publish";

export const runtime = "nodejs";
export const maxDuration = 90;

const bodySchema = z.object({
  post: postSchema,
  mode: z.enum(["demo", "live"]).default("demo"),
  quotaUsed: z.number().int().min(0).optional(),
  simulateFailure: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.post.id !== postId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const live = parsed.data.mode === "live" && getRuntimeConfig().liveAvailable;
  const result = await publishPost({ post: parsed.data.post, live, quotaUsed: parsed.data.quotaUsed, simulateFailure: parsed.data.simulateFailure });
  if (result.kind === "blocked") return NextResponse.json({ error: result.message }, { status: 409 });
  return NextResponse.json(result);
}
