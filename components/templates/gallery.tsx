"use client";

import { useMemo, useState } from "react";
import { useActiveBundle } from "@/components/providers";
import { FAMILIES, type FamilyInfo } from "@/lib/templates/schema";
import { sampleContent } from "@/lib/templates/samples";
import { tokensFor } from "@/lib/templates/tokens";
import { cn } from "@/lib/utils/cn";
import { PreviewDialog } from "./preview-dialog";
import { ScaledCanvas } from "./scaled-canvas";
import { Template } from "./template";
import { TiltCard } from "./tilt-card";

const FORMAT_LABEL = { image: "Image", carousel: "Carousel", reel: "Reel" } as const;

export function TemplateGallery() {
  const bundle = useActiveBundle();
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const [open, setOpen] = useState<FamilyInfo | null>(null);

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {FAMILIES.map((family) => {
          const content = sampleContent(bundle, family.id);
          const slides = family.format === "carousel" ? [0, 1, 2] : [0];
          return (
            <li key={family.id} className={cn(family.size === "reel" && "xl:row-span-1")}>
              <button type="button" onClick={() => setOpen(family)} aria-label={`Open ${family.label} preview`} className="group block w-full text-left">
                <TiltCard className="rounded-2xl">
                  <div className={cn("relative rounded-2xl", family.format === "carousel" && "px-6")}>
                    {/* Carousels render as a fanned stack that spreads on hover. */}
                    {[...slides].reverse().map((s) => (
                      <div
                        key={s}
                        className={cn(s === 0 ? "relative" : "absolute inset-0", "overflow-hidden rounded-2xl border border-line shadow-xl transition-transform duration-300 ease-out")}
                        style={s === 0 ? undefined : { transform: `translateX(${s * 6}px) rotate(${s * 1.5}deg)` }}
                        data-slide={s}
                      >
                        <ScaledCanvas size={family.size} label={`${family.label} sample, ${bundle.business.shortName}`}>
                          <Template family={family.id} tokens={tokens} content={content} size={family.size} slide={s} />
                        </ScaledCanvas>
                      </div>
                    ))}
                  </div>
                </TiltCard>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-medium">{family.label}</span>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-muted">{FORMAT_LABEL[family.format]}</span>
                </div>
                <p className="text-sm text-fg-muted">{family.blurb}</p>
              </button>
            </li>
          );
        })}
      </ul>
      <PreviewDialog
        family={open}
        tokens={tokens}
        content={open ? sampleContent(bundle, open.id) : null}
        businessId={bundle.business.id}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
