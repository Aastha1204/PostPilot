import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config";
import { applyAction } from "@/lib/services/approvals";

export const runtime = "nodejs";

const bodySchema = z.object({ postId: z.string(), action: z.enum(["approve", "edit", "skip"]), comment: z.string().max(300).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const result = await applyAction(token, { ...parsed.data, live: getRuntimeConfig().liveAvailable });
  if (!result.ok) return NextResponse.json({ error: result.error, blocked: result.blocked }, { status: result.status });
  return NextResponse.json({ post: result.post, event: result.event });
}
