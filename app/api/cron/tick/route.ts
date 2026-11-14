import { NextResponse } from "next/server";
import { getMessaging, whatsappConfigured } from "@/lib/adapters/messaging";
import { getPostRepo } from "@/lib/adapters/post-repo";
import { getRuntimeConfig } from "@/lib/config";
import { publishPost } from "@/lib/services/publish";

export const runtime = "nodejs";
export const maxDuration = 120;

const g = globalThis as typeof globalThis & { __ppReminded?: Set<string> };

/** Called every minute by pg_cron or an external scheduler. Publishes due posts and sends the Monday reminder. */
async function tick(req: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? new URL(req.url).searchParams.get("secret");
  if (!secret || supplied !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const live = getRuntimeConfig().liveAvailable;
  const repo = getPostRepo();
  const results: { id: string; outcome: string }[] = [];

  if (repo) {
    for (const post of await repo.listDue(new Date().toISOString())) {
      const r = await publishPost({ post, live });
      if (r.kind === "ok") {
        await repo.patch(post.id, { status: "published", igMediaId: r.outcome.igMediaId });
        results.push({ id: post.id, outcome: "published" });
      } else if (r.kind === "error" && !r.retryable) {
        await repo.patch(post.id, { status: "failed" });
        results.push({ id: post.id, outcome: `failed: ${r.message}` });
      } else {
        results.push({ id: post.id, outcome: r.kind === "deferred" ? "deferred" : "retry next tick" });
      }
    }
  }

  // Monday 10:00 IST reminder, once per day.
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const key = ist.toISOString().slice(0, 10);
  const reminded = (g.__ppReminded ??= new Set());
  let reminder = false;
  if (ist.getUTCDay() === 1 && ist.getUTCHours() === 10 && !reminded.has(key) && whatsappConfigured()) {
    reminded.add(key);
    await getMessaging(live).sendText(process.env.WA_OWNER_NUMBER ?? "", "Namaste! Is hafte ke posts approval ke liye ready hain. Previews abhi bhej rahe hain 👇").catch(() => undefined);
    reminder = true;
  }
  return NextResponse.json({ checkedAt: new Date().toISOString(), results, reminder });
}

export const GET = tick;
export const POST = tick;
