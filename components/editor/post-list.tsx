"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useActiveBundle } from "@/components/providers";
import { PostThumb } from "@/components/calendar/post-thumb";
import { StatusChip } from "@/components/calendar/status";
import { useDemoStore } from "@/lib/store";
import { tokensFor } from "@/lib/templates/tokens";
import { formatTime } from "@/lib/utils/dates";
import { formatDayMonth } from "@/lib/utils/format";

export function PostList() {
  const bundle = useActiveBundle();
  const posts = useDemoStore((s) => s.posts);
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const mine = Object.values(posts).filter((p) => p.businessId === bundle.business.id).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  if (mine.length === 0) {
    return <p className="rounded-card border border-dashed border-line p-8 text-sm text-fg-muted">No posts yet. Generate a month from the calendar.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {mine.map((p) => (
        <li key={p.id}>
          <Link href={`/posts/${p.id}`} className="flex items-center gap-3 rounded-card border border-line bg-panel p-3 hover:bg-panel-2">
            <span className="w-14 shrink-0"><PostThumb post={p} tokens={tokens} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{p.title}</span>
              <span className="block text-xs text-fg-muted">{formatDayMonth(p.scheduledAt.slice(0, 10))}, {formatTime(p.scheduledAt)}</span>
              <span className="mt-1 block"><StatusChip status={p.status} /></span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
