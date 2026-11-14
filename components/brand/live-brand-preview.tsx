"use client";

import { useMemo } from "react";
import { useActiveBundle } from "@/components/providers";
import { ScaledCanvas } from "@/components/templates/scaled-canvas";
import { Template } from "@/components/templates/template";
import { sampleContent } from "@/lib/templates/samples";
import { tokensFor } from "@/lib/templates/tokens";

/** Sample post that redraws instantly as brand kit fields change (the kit is autosaved as you type). */
export function LiveBrandPreview() {
  const bundle = useActiveBundle();
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  return (
    <aside aria-label="Live brand preview" className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Live brand preview</p>
      <ScaledCanvas size="feed" label="Live brand preview" className="overflow-hidden rounded-2xl border border-line shadow-xl">
        <Template family="portfolio" tokens={tokens} content={sampleContent(bundle, "portfolio")} />
      </ScaledCanvas>
    </aside>
  );
}
