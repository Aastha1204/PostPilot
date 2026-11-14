import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatIstStamp } from "@/lib/utils/format";
import type { Post, PostStatus } from "@/lib/types";

const STAGES: { status: PostStatus | "created"; label: string }[] = [
  { status: "created", label: "Created" },
  { status: "awaiting_approval", label: "Sent for approval" },
  { status: "approved", label: "Approved" },
  { status: "scheduled", label: "Scheduled" },
  { status: "published", label: "Published" },
];
const ORDER: Record<PostStatus, number> = { draft: 0, awaiting_approval: 1, approved: 2, scheduled: 3, publishing: 3, published: 4, failed: 3, skipped: 0 };

export function StatusTimeline({ post }: { post: Post }) {
  const reached = ORDER[post.status];
  const stampFor = (status: PostStatus | "created"): string | null => {
    if (status === "created") return formatIstStamp(post.createdAt);
    const entry = [...post.timeline].reverse().find((t) => t.status === status);
    if (entry) return formatIstStamp(entry.at);
    return status === "published" && post.status === "published" ? formatIstStamp(post.scheduledAt) : null;
  };
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Status timeline">
      {STAGES.map((stage, i) => {
        const done = i <= reached;
        const stamp = done ? stampFor(stage.status) : null;
        return (
          <li key={stage.label} className="flex items-start gap-2">
            <span className={cn("mt-0.5 grid size-5 place-items-center rounded-full border", done ? "border-accent bg-accent text-on-accent" : "border-line text-transparent")}>
              <Check className="size-3" aria-hidden />
            </span>
            <span>
              <span className={cn("block text-sm", !done && "text-fg-muted")}>{stage.label}</span>
              {stamp && <span className="block text-[11px] text-fg-muted">{stamp}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
