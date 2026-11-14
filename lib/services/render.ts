import { ImageResponse } from "next/og";
import sharp from "sharp";
import { Template } from "@/components/templates/template";
import { CANVAS, type CanvasSize, type FamilyId, type TemplateContent } from "@/lib/templates/schema";
import { loadFonts } from "@/lib/templates/fonts.server";
import type { DesignTokens } from "@/lib/templates/tokens";

export interface RenderInput {
  family: FamilyId;
  tokens: DesignTokens;
  content: TemplateContent;
  size: CanvasSize;
  slide: number;
  format: "jpeg" | "png";
}

/** Renders a design to PNG (Satori), then to JPEG for Instagram when requested. */
export async function renderDesign(input: RenderInput): Promise<{ body: Buffer; contentType: string }> {
  const { width, height } = CANVAS[input.size];
  const fonts = await loadFonts([input.tokens.headingFont, input.tokens.bodyFont]);
  const png = Buffer.from(
    await new ImageResponse(
      Template({ family: input.family, tokens: input.tokens, content: input.content, size: input.size, slide: input.slide }),
      { width, height, fonts },
    ).arrayBuffer(),
  );
  if (input.format === "png") return { body: png, contentType: "image/png" };
  // Instagram expects JPEG; flatten so no transparency is left.
  const body = await sharp(png).flatten({ background: input.tokens.bg }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return { body, contentType: "image/jpeg" };
}

import { getBundle } from "@/lib/seed";
import { tokensFor, withDesignOptions } from "@/lib/templates/tokens";
import type { Post } from "@/lib/types";

/** JPEG for each slide of a post (carousels have a cover plus one per slide). */
export async function renderPostSlides(post: Post): Promise<Buffer[]> {
  const tokens = withDesignOptions(tokensFor(getBundle(post.businessId)), { variant: post.variant, watermark: post.watermark, themeId: post.themeId });
  const count = post.templateId === "tip-carousel" ? (post.templateProps.slides?.length ?? 0) + 1 : 1;
  const size = post.format === "reel" ? "reel" : "feed";
  const out: Buffer[] = [];
  for (let slide = 0; slide < count; slide += 1) {
    out.push((await renderDesign({ family: post.templateId, tokens, content: post.templateProps, size, slide, format: "jpeg" })).body);
  }
  return out;
}
