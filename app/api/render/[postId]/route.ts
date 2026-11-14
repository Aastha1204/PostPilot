import { NextResponse } from "next/server";
import { z } from "zod";
import { renderDesign } from "@/lib/services/render";
import { resolveDesign } from "@/lib/templates/resolve";

export const runtime = "nodejs";

const querySchema = z.object({
  business: z.string().default("shubh-vivah"),
  format: z.enum(["jpeg", "png"]).default("jpeg"),
  size: z.enum(["feed", "square", "reel"]).optional(),
  slide: z.coerce.number().int().min(0).max(5).default(0),
});

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const query = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!query.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const design = resolveDesign(postId, query.data.business, query.data.size);
  if (!design) return NextResponse.json({ error: "Unknown design" }, { status: 404 });

  try {
    const { body, contentType } = await renderDesign({ ...design, slide: query.data.slide, format: query.data.format });
    return new Response(new Uint8Array(body), {
      headers: { "content-type": contentType, "cache-control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
