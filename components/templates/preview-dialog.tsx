"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { FamilyInfo, TemplateContent } from "@/lib/templates/schema";
import { Template } from "./template";
import { ScaledCanvas } from "./scaled-canvas";

interface Props {
  family: FamilyInfo | null;
  tokens: DesignTokens;
  content: TemplateContent | null;
  businessId: string;
  onClose: () => void;
}

export function PreviewDialog({ family, tokens, content, businessId, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (family && !dialog.open) dialog.showModal();
    if (!family && dialog.open) dialog.close();
  }, [family]);

  useEffect(() => setSlide(0), [family]);

  const total = family?.format === "carousel" ? (content?.slides?.length ?? 0) + 1 : 1;
  const exportUrl = family ? `/api/render/sample-${family.id}?business=${businessId}&format=jpeg&slide=${slide}` : "#";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={family ? `${family.label} preview` : "Template preview"}
      className="m-auto max-h-[92dvh] w-[min(94vw,880px)] rounded-card border border-line bg-panel p-0 text-fg backdrop:bg-black/70"
    >
      {family && content && (
        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,320px)_1fr] sm:p-6">
          <div className="relative">
            <ScaledCanvas size={family.size} label={`${family.label} full-size preview`} className="overflow-hidden rounded-xl border border-line">
              <Template family={family.id} tokens={tokens} content={content} size={family.size} slide={slide} />
            </ScaledCanvas>
            {total > 1 && (
              <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                <button type="button" aria-label="Previous slide" disabled={slide === 0} onClick={() => setSlide((s) => s - 1)} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-40">
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className="text-fg-muted">Slide {slide + 1} of {total}</span>
                <button type="button" aria-label="Next slide" disabled={slide === total - 1} onClick={() => setSlide((s) => s + 1)} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-40">
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{family.label}</h2>
                <p className="mt-1 text-sm text-fg-muted">{family.blurb}</p>
              </div>
              <button type="button" aria-label="Close preview" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-fg-muted hover:text-fg">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-fg-muted">Canvas</dt><dd>{family.size === "reel" ? "1080 × 1920" : family.size === "square" ? "1080 × 1080" : "1080 × 1350"}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-muted">Format</dt><dd className="capitalize">{family.format}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-muted">Fonts</dt><dd>{tokens.headingFont} / {tokens.bodyFont}</dd></div>
            </dl>
            {family.sampleNote && <p className="mt-4 rounded-xl bg-panel-2 px-3 py-2 text-xs text-fg-muted">{family.sampleNote}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <button
                type="button"
                onClick={() => {
                  toast.success(`Starting a ${family.label.toLowerCase()} post`);
                  router.push(`/posts/new-${family.id}`);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"
              >
                <Plus className="size-4" aria-hidden /> Use in a new post
              </button>
              <a href={exportUrl} download={`${family.id}-${slide + 1}.jpg`} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:bg-panel-2">
                <Download className="size-4" aria-hidden /> Export JPEG
              </a>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
