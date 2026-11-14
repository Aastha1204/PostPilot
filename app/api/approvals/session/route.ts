import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config";
import { postSchema } from "@/lib/schemas";
import { createSession } from "@/lib/services/approvals";

export const runtime = "nodejs";

const bodySchema = z.object({ businessId: z.string(), weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), posts: z.array(postSchema).min(1).max(30) });

export async function POST(req: Request) {
  if (!getRuntimeConfig().approvalSync) return NextResponse.json({ error: "Phone approval isn't configured" }, { status: 501 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const session = await createSession(parsed.data.businessId, parsed.data.weekStart, parsed.data.posts);
  return NextResponse.json({ token: session.token });
}
