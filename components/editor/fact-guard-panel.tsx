"use client";

import { Check, ShieldAlert } from "lucide-react";
import type { FactFlag } from "@/lib/types";

interface Props {
  flags: FactFlag[];
  confirmed: string[];
  disabled: boolean;
  onToggleConfirm: (text: string) => void;
}

export function FactGuardPanel({ flags, confirmed, disabled, onToggleConfirm }: Props) {
  const open = flags.filter((f) => f.status === "warn" && !confirmed.includes(f.text)).length;
  return (
    <section aria-label="Fact guard" className="rounded-card border border-line bg-panel p-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-medium"><ShieldAlert className="size-4 text-accent" aria-hidden /> Fact guard</h2>
      <p className="mb-3 text-xs text-fg-muted">Every number, amount, percentage and date in the caption is checked against the brand kit.</p>
      {flags.length === 0 ? (
        <p className="text-sm text-fg-muted">No numbers or dates found in this caption.</p>
      ) : (
        <ul className="space-y-2">
          {flags.map((f) => {
            const ok = f.status === "ok";
            const isConfirmed = confirmed.includes(f.text);
            return (
              <li key={`${f.kind}-${f.text}`} className="flex items-center justify-between gap-3 rounded-xl bg-panel-2 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span aria-label={ok ? "Found in brand kit" : isConfirmed ? "Confirmed by you" : "Not in brand kit"} className={ok || isConfirmed ? "text-green-500" : "text-amber-500"}>{ok || isConfirmed ? "✓" : "⚠"}</span>
                  <span><span className="font-medium">{f.text}</span> <span className="text-xs text-fg-muted">{f.kind}</span></span>
                </span>
                {!ok && (
                  <button type="button" disabled={disabled} onClick={() => onToggleConfirm(f.text)} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs hover:bg-panel disabled:opacity-50">
                    {isConfirmed ? "Undo confirm" : "Confirm it's accurate"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className={`mt-3 flex items-center gap-2 text-xs ${open ? "text-amber-500" : "text-green-500"}`}>
        {open ? `Approve is disabled until ${open} item${open === 1 ? " is" : "s are"} edited out or confirmed.` : <><Check className="size-3.5" aria-hidden /> Ready for approval from a facts point of view.</>}
      </p>
    </section>
  );
}
