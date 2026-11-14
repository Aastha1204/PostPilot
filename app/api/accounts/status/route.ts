import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/config";
import { getPublisher, igConfigured } from "@/lib/adapters/publisher";
import { whatsappConfigured } from "@/lib/adapters/messaging";

export const runtime = "nodejs";

/** Connection state and the rolling publishing quota. Never returns tokens. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = url.searchParams.get("mode") === "live" && getRuntimeConfig().liveAvailable;
  const used = Number(url.searchParams.get("used")) || undefined;
  const quota = await getPublisher(live).getQuota({ used });
  return NextResponse.json({
    live,
    quota,
    instagram: { configured: igConfigured() },
    facebook: { configured: Boolean(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN) },
    whatsapp: { configured: whatsappConfigured() },
    openai: getRuntimeConfig().openai,
  }, { headers: { "cache-control": "no-store" } });
}
