"use client";

import { useMemo } from "react";
import { ScaledCanvas } from "@/components/templates/scaled-canvas";
import { Template } from "@/components/templates/template";
import { withDesignOptions, type DesignTokens } from "@/lib/templates/tokens";
import type { Post } from "@/lib/types";

export function postSize(post: Post) {
  return post.format === "reel" ? "reel" : "feed";
}

export function PostThumb({ post, tokens, slide = 0, className }: { post: Post; tokens: DesignTokens; slide?: number; className?: string }) {
  const size = postSize(post);
  const styled = useMemo(() => withDesignOptions(tokens, { variant: post.variant, watermark: post.watermark, themeId: post.themeId }), [tokens, post.variant, post.watermark, post.themeId]);
  return (
    <ScaledCanvas size={size} label={`${post.title} design`} className={className ?? "overflow-hidden rounded-md border border-line"} key={size}>
      <Template family={post.templateId} tokens={styled} content={post.templateProps} size={size} slide={slide} />
    </ScaledCanvas>
  );
}
