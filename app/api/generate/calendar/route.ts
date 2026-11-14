import { z } from "zod";
import { getRuntimeConfig } from "@/lib/config";
import { getBundle } from "@/lib/seed";
import { generateCalendar, type GenEvent } from "@/lib/services/calendar-generator";

export const runtime = "nodejs";
export const maxDuration = 90;

const bodySchema = z.object({
  businessId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mode: z.enum(["demo", "live"]).default("demo"),
  speed: z.enum(["realistic", "fast"]).default("realistic"),
  existingTitles: z.array(z.string()).max(100).default([]),
});

/** Streams NDJSON: one GenEvent per line. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const input = parsed.data;
  const live = input.mode === "live" && getRuntimeConfig().liveAvailable;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: GenEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        for await (const event of generateCalendar({
          bundle: getBundle(input.businessId),
          month: input.month,
          mode: live ? "live" : "demo",
          speed: input.speed,
          existingTitles: input.existingTitles,
        })) {
          send(event);
        }
      } catch {
        send({ type: "notice", message: "Generation hit a snag. Showing what was planned so far." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}
