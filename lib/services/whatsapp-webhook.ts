import { createHmac, timingSafeEqual } from "node:crypto";
import type { MessagingProvider } from "@/lib/adapters/messaging";
import { applyAction } from "./approvals";

type Pending = Map<string, { token: string; postId: string }>;
const g = globalThis as typeof globalThis & { __ppWaPending?: Pending; __ppWaSeen?: Set<string> };
// Process-local: fine for a single node. Use message_log (unique wa_message_id) when running serverless.
const pending = (): Pending => (g.__ppWaPending ??= new Map());
const seen = (): Set<string> => (g.__ppWaSeen ??= new Set());

/** Verifies Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(header.slice(7));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

interface WaMessage {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  button?: { payload?: string };
  interactive?: { button_reply?: { id?: string } };
}

function parseButtonId(id: string | undefined): { token: string; postId: string; action: "approve" | "edit" | "skip" } | null {
  const m = /^pp:([^:]+):([^:]+):(approve|edit|skip)$/.exec(id ?? "");
  return m ? { token: m[1]!, postId: m[2]!, action: m[3] as "approve" | "edit" | "skip" } : null;
}

/** Maps button taps to approvals and free text to the latest post awaiting an edit. Idempotent by message id. */
export async function handleWebhook(payload: unknown, messaging: MessagingProvider, live: boolean): Promise<void> {
  const entries = (payload as { entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[] }).entry ?? [];
  for (const msg of entries.flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.messages ?? [])) {
    if (seen().has(msg.id)) continue;
    seen().add(msg.id);

    const tap = parseButtonId(msg.button?.payload ?? msg.interactive?.button_reply?.id);
    if (tap) {
      if (tap.action === "edit") {
        pending().set(msg.from, { token: tap.token, postId: tap.postId });
        await messaging.sendText(msg.from, "Kya change karna hai?");
        continue;
      }
      const r = await applyAction(tap.token, { postId: tap.postId, action: tap.action, live });
      await messaging.sendText(msg.from, r.ok ? (tap.action === "approve" ? "Done! Post schedule ho gaya ✅" : "Skip kar diya 👍") : r.blocked?.length ? `Is post mein ek detail verify karni hai: "${r.blocked[0]}". Edit dabakar ise badal dein.` : r.error);
      continue;
    }

    if (msg.type === "text" && msg.text?.body) {
      const target = pending().get(msg.from);
      if (!target) {
        await messaging.sendText(msg.from, "Pehle kisi post par ✏️ Edit dabaiye, phir batayiye kya badalna hai 🙂");
        continue;
      }
      pending().delete(msg.from);
      const r = await applyAction(target.token, { postId: target.postId, action: "edit", comment: msg.text.body, live });
      await messaging.sendText(msg.from, r.ok ? `Updated ✨\n\n${r.post.caption}` : r.error);
    }
  }
}
