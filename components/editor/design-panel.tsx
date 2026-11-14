"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PostThumb } from "@/components/calendar/post-thumb";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { fileToDataUrl } from "@/lib/utils/image";

const VARIANTS = ["Classic", "Bold", "Soft"];
const PHOTO_FAMILIES = ["portfolio", "reel-cover"];

interface Props {
  post: Post;
  tokens: DesignTokens;
  locked: boolean;
  onChange: (patch: Partial<Post>) => void;
}

export function DesignPanel({ post, tokens, locked, onChange }: Props) {
  const [slide, setSlide] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const slides = post.templateProps.slides ?? [];
  const total = post.templateId === "tip-carousel" ? slides.length + 1 : 1;
  const current = Math.min(slide, total - 1);
  const hasPhotoSlot = PHOTO_FAMILIES.includes(post.templateId);

  function move(index: number, dir: -1 | 1) {
    const next = [...slides];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange({ templateProps: { ...post.templateProps, slides: next } });
    setSlide(target + 1);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const photoUrl = await fileToDataUrl(file);
      onChange({ templateProps: { ...post.templateProps, photoUrl, aiVisual: false } });
      toast.success("Photo swapped");
    } catch {
      toast.error("That file couldn't be read as an image");
    }
  }

  return (
    <section aria-label="Design" className="space-y-4">
      <div className={post.format === "reel" ? "mx-auto max-w-[260px]" : "mx-auto max-w-[420px]"}>
        <PostThumb post={post} tokens={tokens} slide={current} className="overflow-hidden rounded-xl border border-line shadow-2xl" />
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" aria-label="Previous slide" disabled={current === 0} onClick={() => setSlide(current - 1)} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden /></button>
          <span className="text-fg-muted">Slide {current + 1} of {total}</span>
          <button type="button" aria-label="Next slide" disabled={current === total - 1} onClick={() => setSlide(current + 1)} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-40"><ChevronRight className="size-4" aria-hidden /></button>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Design variant</h3>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Design variant">
          {VARIANTS.map((label, i) => (
            <button key={label} type="button" role="radio" aria-checked={post.variant === i} disabled={locked} onClick={() => onChange({ variant: i })} className={cn("rounded-xl border p-1.5 text-center text-xs disabled:opacity-60", post.variant === i ? "border-accent" : "border-line hover:bg-panel-2")}>
              <PostThumb post={{ ...post, variant: i }} tokens={tokens} className="mb-1.5 overflow-hidden rounded-md" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {post.templateId === "tip-carousel" && slides.length > 1 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Reorder slides</h3>
          <ol className="space-y-1.5">
            {slides.map((s, i) => (
              <li key={`${s.title}-${i}`} className="flex items-center gap-2 rounded-xl bg-panel-2 px-3 py-1.5 text-sm">
                <span className="flex-1 truncate">{i + 1}. {s.title}</span>
                <button type="button" aria-label={`Move ${s.title} up`} disabled={locked || i === 0} onClick={() => move(i, -1)} className="grid size-6 place-items-center rounded-full hover:bg-panel disabled:opacity-30"><ArrowUp className="size-3.5" aria-hidden /></button>
                <button type="button" aria-label={`Move ${s.title} down`} disabled={locked || i === slides.length - 1} onClick={() => move(i, 1)} className="grid size-6 place-items-center rounded-full hover:bg-panel disabled:opacity-30"><ArrowDown className="size-3.5" aria-hidden /></button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Choose a photo" onChange={(e) => void onFile(e.target.files?.[0])} />
        <button type="button" disabled={locked || !hasPhotoSlot} data-tip={hasPhotoSlot ? undefined : "This template has no photo slot"} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs hover:bg-panel-2 disabled:opacity-50">
          <ImagePlus className="size-3.5" aria-hidden /> Swap photo
        </button>
        {post.templateProps.photoUrl && (
          <button type="button" disabled={locked} onClick={() => onChange({ templateProps: { ...post.templateProps, photoUrl: null } })} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs hover:bg-panel-2 disabled:opacity-50"><Trash2 className="size-3.5" aria-hidden /> Remove photo</button>
        )}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" role="switch" checked={post.watermark} disabled={locked} onChange={(e) => onChange({ watermark: e.target.checked })} className="size-4 accent-[var(--accent)]" />
          Logo watermark
        </label>
      </div>
    </section>
  );
}
