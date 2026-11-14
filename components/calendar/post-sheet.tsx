"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { ContentPillar, Post } from "@/lib/types";
import { formatDayMonth } from "@/lib/utils/format";
import { formatTime, postDate } from "@/lib/utils/dates";
import { PostThumb } from "./post-thumb";
import { StatusChip } from "./status";

interface Props {
  post: Post;
  tokens: DesignTokens;
  pillar?: ContentPillar;
  onClose: () => void;
}

export function PostSheet({ post, tokens, pillar, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside role="dialog" aria-label={`Post: ${post.title}`} onClick={(e) => e.stopPropagation()} className="glass h-full w-full max-w-md overflow-y-auto p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold leading-tight">{post.title}</h2>
            <p className="mt-1 text-sm text-fg-muted">{formatDayMonth(postDate(post.scheduledAt))}, {formatTime(post.scheduledAt)} IST{pillar ? ` · ${pillar.name}` : ""}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-fg-muted hover:text-fg"><X className="size-4" aria-hidden /></button>
        </div>
        <div className="mx-auto mb-4 w-56"><PostThumb post={post} tokens={tokens} /></div>
        <div className="mb-3"><StatusChip status={post.status} /></div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{post.caption}</p>
        <p className="mt-3 text-sm text-accent">{post.hashtags.join(" ")}</p>
        {post.factFlags.some((f) => f.status === "warn") && (
          <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            Needs review: {post.factFlags.filter((f) => f.status === "warn").map((f) => `"${f.text}"`).join(", ")} is not in the brand kit.
          </p>
        )}
        <Link href={`/posts/${post.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent">
          Open full editor <ExternalLink className="size-4" aria-hidden />
        </Link>
      </aside>
    </div>
  );
}
