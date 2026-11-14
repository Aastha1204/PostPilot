import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config";
import { getBundle } from "@/lib/seed";
import { editPost } from "@/lib/services/post-edit";

export const runtime = "nodejs";

const bodySchema = z.object({
  businessId: z.string(),
  mode: z.enum(["demo", "live"]).default("demo"),
  post: z.object({ caption: z.string().max(4000), hashtags: z.array(z.string()).max(60), cta: z.string().max(200) }),
  instruction: z.string().max(300).optional(),
  action: z.enum(["shorter", "festive", "hinglish", "formal"]).optional(),
}).refine((b) => b.instruction || b.action, { message: "Provide an instruction or an action" });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { businessId, mode, post, instruction, action } = parsed.data;
  const result = await editPost({
    bundle: getBundle(businessId),
    post,
    instruction,
    action,
    live: mode === "live" && getRuntimeConfig().liveAvailable,
  });
  return NextResponse.json(result);
}
