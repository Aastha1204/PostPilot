"use client";

import { Check, Loader2, X } from "lucide-react";
import { STEPS, type StepState } from "@/lib/use-generation";
import type { GenerationSummary, StepId } from "@/lib/services/calendar-generator";

interface Props {
  steps: Record<StepId, StepState>;
  running: boolean;
  summary: GenerationSummary | null;
  onDismiss: () => void;
}

export function PlanningPanel({ steps, running, summary, onDismiss }: Props) {
  return (
    <section aria-label="Planning your month" className="rounded-card border border-line bg-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">Planning your month</h2>
        {!running && (
          <button type="button" aria-label="Dismiss" onClick={onDismiss} className="grid size-7 place-items-center rounded-full text-fg-muted hover:text-fg">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <ol className="space-y-2.5">
        {STEPS.map(({ id, label }) => (
          <li key={id} className="flex items-center gap-3 text-sm">
            <span className="grid size-5 place-items-center rounded-full border border-line">
              {steps[id] === "done" ? <Check className="size-3.5 text-accent" aria-hidden /> : steps[id] === "active" ? <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden /> : null}
            </span>
            <span className={steps[id] === "pending" ? "text-fg-muted" : ""}>{label}</span>
          </li>
        ))}
      </ol>
      {summary && (
        <p className="mt-4 rounded-xl bg-panel-2 px-3 py-2.5 text-sm">
          {summary.posts} posts · {summary.pillars} pillars · {summary.festivals} festival{summary.festivals === 1 ? "" : "s"} covered · {summary.duplicates} duplicate ideas ·{" "}
          <span className={summary.needReview ? "text-amber-500" : undefined}>{summary.needReview} post{summary.needReview === 1 ? "" : "s"} need review</span>
        </p>
      )}
    </section>
  );
}
