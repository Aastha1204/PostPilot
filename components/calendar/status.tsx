import { Film, GalleryHorizontal, Image as ImageIcon, type LucideIcon } from "lucide-react";
import type { PostFormat, PostStatus } from "@/lib/types";

export const STATUS_META: Record<PostStatus, { label: string; colour: string }> = {
  draft: { label: "Draft", colour: "#9a98a8" },
  awaiting_approval: { label: "Awaiting approval", colour: "#f59e0b" },
  approved: { label: "Approved", colour: "#3b82f6" },
  scheduled: { label: "Scheduled", colour: "#8b5cf6" },
  publishing: { label: "Publishing", colour: "#06b6d4" },
  published: { label: "Published", colour: "#22c55e" },
  failed: { label: "Failed", colour: "#ef4444" },
  skipped: { label: "Skipped", colour: "#6b7280" },
};

export const FORMAT_META: Record<PostFormat, { label: string; icon: LucideIcon }> = {
  image: { label: "Image", icon: ImageIcon },
  carousel: { label: "Carousel", icon: GalleryHorizontal },
  reel: { label: "Reel", icon: Film },
};

export function StatusChip({ status, compact = false }: { status: PostStatus; compact?: boolean }) {
  const { label, colour } = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px] text-fg" title={label}>
      <span className="size-2 rounded-full" style={{ background: colour }} aria-hidden />
      <span className={compact ? "sr-only" : undefined}>{label}</span>
    </span>
  );
}
