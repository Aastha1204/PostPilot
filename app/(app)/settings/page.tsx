"use client";

import { TriangleAlert } from "lucide-react";
import { useActiveBundle } from "@/components/providers";
import { PageHeader } from "@/components/ui/page-header";
import { festivalsFor } from "@/lib/festivals";
import { useDemoStore } from "@/lib/store";
import { formatDayMonth } from "@/lib/utils/format";

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-fg-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--accent)]" />
    </label>
  );
}

export default function SettingsPage() {
  const { business } = useActiveBundle();
  const settings = useDemoStore((s) => s.settings);
  const update = useDemoStore((s) => s.updateSettings);
  const unverified = festivalsFor(business.type).filter((f) => !f.verified);

  return (
    <>
      <PageHeader title="Settings" description="Demo toggles and festival calendar review." />

      <div className="grid max-w-3xl gap-4">
        <section className="rounded-card border border-line bg-panel px-5 py-2">
          <h2 className="pt-3 text-sm font-medium text-fg-muted">Demo toggles</h2>
          <Toggle
            label="Fast generation (15 s)"
            hint="Streams the December calendar in about 15 seconds instead of 60."
            checked={settings.generationSpeed === "fast"}
            onChange={(v) => update({ generationSpeed: v ? "fast" : "realistic" })}
          />
          <Toggle
            label="Simulate a failed publish"
            hint="One job fails, retries with backoff and then succeeds."
            checked={settings.simulateFailedPublish}
            onChange={(v) => update({ simulateFailedPublish: v })}
          />
        </section>

        <section className="rounded-card border border-line bg-panel p-5">
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Festival calendar</h2>
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
            Verify festival dates against a panchang before client release.
          </p>
          <ul className="divide-y divide-[var(--line)] text-sm">
            {unverified.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>{f.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-fg-muted">
                  {formatDayMonth(f.date)}
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-500">Needs review</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
