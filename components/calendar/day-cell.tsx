"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/dates";
import type { DesignTokens } from "@/lib/templates/tokens";
import type { ContentPillar, Festival, Post } from "@/lib/types";
import { FestivalMarker } from "./festival-marker";
import { PostThumb } from "./post-thumb";
import { FORMAT_META, STATUS_META } from "./status";

interface ChipProps {
  post: Post;
  tokens: DesignTokens;
  pillar?: ContentPillar;
  flipIn: boolean;
  onOpen: (id: string) => void;
}

function PostChip({ post, tokens, pillar, flipIn, onOpen }: ChipProps) {
  const reduced = useReducedMotion();
  const locked = post.status === "published";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id, disabled: locked });
  const Icon = FORMAT_META[post.format].icon;
  const warn = post.factFlags.some((f) => f.status === "warn");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, zIndex: isDragging ? 50 : undefined, perspective: 600 }}
    >
      <motion.button
        type="button"
        {...attributes}
        {...listeners}
        onClick={() => onOpen(post.id)}
        initial={flipIn ? (reduced ? { opacity: 0 } : { rotateX: 90, opacity: 0 }) : false}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: reduced ? 0.2 : 0.6, ease: "easeOut" }}
        aria-label={`${post.title}, ${STATUS_META[post.status].label}, ${formatTime(post.scheduledAt)}. ${locked ? "" : "Drag to reschedule."}`}
        className={cn(
          "relative flex w-full items-start gap-1.5 overflow-hidden rounded-lg border border-line bg-panel-2 p-1 text-left",
          !locked && "cursor-grab active:cursor-grabbing",
          isDragging && "shadow-2xl ring-2 ring-accent",
        )}
      >
        <span className="w-7 shrink-0"><PostThumb post={post} tokens={tokens} /></span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[10.5px] leading-tight">{post.title}</span>
          <span className="mt-1 flex items-center gap-1 text-fg-muted">
            <Icon className="size-3" aria-hidden />
            <span className="size-2 rounded-full" style={{ background: pillar?.colour }} aria-hidden />
            <span className="size-2 rounded-full" style={{ background: STATUS_META[post.status].colour }} aria-hidden />
            {warn && <span className="text-[10px] text-amber-500" aria-label="Needs review">!</span>}
          </span>
        </span>
        {flipIn && !reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(105deg, transparent 30%, color-mix(in srgb, var(--brand-secondary) 70%, white) 50%, transparent 70%)" }}
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.9, delay: 0.35 }}
          />
        )}
      </motion.button>
    </div>
  );
}

interface CellProps {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  posts: Post[];
  festival?: Festival;
  tokens: DesignTokens;
  pillars: ContentPillar[];
  arrived: ReadonlySet<string>;
  tall?: boolean;
  onOpen: (id: string) => void;
}

export function DayCell({ date, inMonth, isToday, posts, festival, tokens, pillars, arrived, tall, onOpen }: CellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const festivalPlanned = posts.some((p) => p.festivalId === festival?.id);
  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      className={cn(
        "flex flex-col gap-1 border-b border-r border-line p-1.5",
        tall ? "min-h-[320px]" : "min-h-[124px]",
        !inMonth && "bg-panel-2/40 text-fg-muted",
        isOver && "bg-accent/10 outline outline-2 -outline-offset-2 outline-[var(--accent)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("grid size-6 place-items-center rounded-full text-xs", isToday && "bg-accent font-semibold text-on-accent")}>{Number(date.slice(8))}</span>
        {festival && <FestivalMarker name={festival.name} planned={festivalPlanned} />}
      </div>
      {posts.map((p) => (
        <PostChip key={p.id} post={p} tokens={tokens} pillar={pillars.find((x) => x.id === p.pillarId)} flipIn={arrived.has(p.id)} onOpen={onOpen} />
      ))}
    </div>
  );
}
