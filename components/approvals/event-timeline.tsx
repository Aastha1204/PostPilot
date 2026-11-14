"use client";

import { useDemoStore } from "@/lib/store";
import { formatIstTime24 } from "@/lib/utils/format";

export function EventTimeline({ businessId }: { businessId: string }) {
  const log = useDemoStore((s) => s.approvalLog[businessId]) ?? [];
  return (
    <section aria-label="Live events" className="w-full max-w-[200px] self-center rounded-card border border-line bg-panel p-3">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Live events</h2>
      {log.length === 0 ? (
        <p className="text-xs text-fg-muted">Approvals will appear here as they happen.</p>
      ) : (
        <ol className="space-y-2.5 border-l border-line pl-3" aria-live="polite">
          {log.map((e) => (
            <li key={e.id} className="relative text-xs leading-snug">
              <span className="absolute -left-[17px] top-1 size-2 rounded-full bg-accent" aria-hidden />
              <span className="block text-[10px] text-fg-muted">{formatIstTime24(e.at)}</span>
              {e.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
