"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ProgressRing({ count, total }: { count: number; total: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? count / total : 0;
  return (
    <span className="inline-flex items-center gap-3" role="status" aria-live="polite">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <span className="text-sm font-medium">{total > 0 ? `${count} of ${total} posts` : "Planning…"}</span>
    </span>
  );
}

interface Props {
  label: string;
  running: boolean;
  count: number;
  total: number;
  disabled: boolean;
  reason?: string;
  onClick: () => void;
}

export function GenerateButton({ label, running, count, total, disabled, reason, onClick }: Props) {
  if (running) {
    return <div className="rounded-full border border-line bg-panel px-4 py-1.5"><ProgressRing count={count} total={total} /></div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tip={disabled ? reason : undefined}
      className={cn("gen-border inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium", disabled && "cursor-not-allowed opacity-60")}
    >
      <Sparkles className="size-4 text-accent" aria-hidden /> {label}
    </button>
  );
}
