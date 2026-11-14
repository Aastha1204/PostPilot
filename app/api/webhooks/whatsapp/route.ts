import { NextResponse } from "next/server";
import { getMessaging } from "@/lib/adapters/messaging";
import { handleWebhook, verifySignature } from "@/lib/services/whatsapp-webhook";

export const runtime = "nodejs";

/** Meta's webhook verification handshake. */
export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const token = process.env.WA_VERIFY_TOKEN;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  // Acknowledge fast; WhatsApp retries on slow or failing responses.
  await handleWebhook(payload, getMessaging(true), true).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
