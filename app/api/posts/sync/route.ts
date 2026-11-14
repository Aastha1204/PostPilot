import { NextResponse } from "next/server";
import { z } from "zod";
import { getPostRepo } from "@/lib/adapters/post-repo";
import { postSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** Live mode: mirror an approved or scheduled post to Supabase so the cron tick can publish it on time. */
export async function POST(req: Request) {
  const repo = getPostRepo();
  if (!repo) return NextResponse.json({ synced: false, reason: "Supabase is not configured" });
  const parsed = z.object({ post: postSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await repo.upsert(parsed.data.post);
  return NextResponse.json({ synced: true });
}
