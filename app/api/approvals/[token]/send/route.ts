import { NextResponse } from "next/server";
import { getApprovalStore } from "@/lib/adapters/approval-store";
import { getMessaging, whatsappConfigured } from "@/lib/adapters/messaging";
import { getStorage } from "@/lib/adapters/storage";
import { getRuntimeConfig } from "@/lib/config";
import { renderPostSlides } from "@/lib/services/render";

export const runtime = "nodejs";
export const maxDuration = 90;

/** Sends the session's posts to the owner on WhatsApp (live), or reports a simulated send (demo). */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as { mode?: string };
  const live = body.mode === "live" && getRuntimeConfig().liveAvailable && whatsappConfigured();
  const session = await getApprovalStore().getSession(token);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const messaging = getMessaging(live);
  const storage = getStorage(live);
  const to = process.env.WA_OWNER_NUMBER ?? "";
  let sent = 0;
  try {
    for (const post of session.posts) {
      const imageUrl = live ? await storage.upload(`${post.businessId}/preview-${post.id}.jpg`, (await renderPostSlides(post))[0]!, "image/jpeg") : "";
      await messaging.sendPreview({
        to,
        imageUrl,
        caption: `${post.title}\n\n${post.caption}`,
        buttonIds: { approve: `pp:${token}:${post.id}:approve`, edit: `pp:${token}:${post.id}:edit`, skip: `pp:${token}:${post.id}:skip` },
      });
      sent += 1;
    }
  } catch {
    return NextResponse.json({ error: "WhatsApp send failed", sent }, { status: 502 });
  }
  return NextResponse.json({ sent, provider: messaging.name });
}
