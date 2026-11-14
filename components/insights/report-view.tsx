"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PostThumb } from "@/components/calendar/post-thumb";
import { useActiveBundle } from "@/components/providers";
import { BusinessLogo } from "@/components/shell/business-logo";
import { baselineFor, change, insightRows, pct, signed, totals } from "@/lib/insights";
import { useDemoStore } from "@/lib/store";
import { tokensFor } from "@/lib/templates/tokens";
import { formatDayMonth } from "@/lib/utils/format";

/** Two-page branded report. The app shell is hidden when printing, so "Save as PDF" gives just these pages. */
export function ReportView() {
  const bundle = useActiveBundle();
  const posts = useDemoStore((s) => s.posts);
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const params = useSearchParams();
  const rows = insightRows(Object.values(posts), bundle.business.id, "2026-11");
  const t = totals(rows);
  const base = baselineFor(bundle.business.id);
  const top = [...rows].sort((a, b) => b.engagement - a.engagement).slice(0, 3);
  const plan = Object.values(posts).filter((p) => p.businessId === bundle.business.id && p.scheduledAt.startsWith("2026-12")).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  useEffect(() => {
    if (params.get("print") === "1") {
      const id = setTimeout(() => window.print(), 900);
      return () => clearTimeout(id);
    }
  }, [params]);

  const kpis = [
    ["Reach", t.reach.toLocaleString("en-IN"), change(t.reach, base?.reach)],
    ["Engagement rate", pct(t.engagementRate), change(t.engagementRate, base?.engagementRate)],
    ["Saves", String(t.saves), change(t.saves, base?.saves)],
    ["Profile visits", t.visits.toLocaleString("en-IN"), change(t.visits, base?.visits)],
  ] as const;

  return (
    <div className="report mx-auto max-w-3xl space-y-6 text-[#1a1a22]">
      <p className="print:hidden text-sm text-fg-muted">Use your browser&apos;s Print dialog and choose “Save as PDF”. <button type="button" onClick={() => window.print()} className="underline">Print now</button></p>
      {[1, 2].map((page) => (
        <section key={page} className="report-page rounded-2xl bg-white p-10 shadow-xl print:break-after-page print:rounded-none print:shadow-none" style={{ minHeight: 960, borderTop: `10px solid ${bundle.brandKit.colours.primary}` }}>
          <header className="mb-8 flex items-center gap-4">
            <BusinessLogo business={bundle.business} kit={bundle.brandKit} className="size-12" />
            <div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: `"${bundle.brandKit.fonts.heading}", serif`, color: bundle.brandKit.colours.primary }}>{bundle.business.name}</h1>
              <p className="text-sm text-[#5b5968]">Monthly report · November 2026 · Demo data · Page {page} of 2</p>
            </div>
          </header>
          {page === 1 ? (
            <>
              <h2 className="mb-3 text-lg font-semibold">Highlights</h2>
              <div className="grid grid-cols-2 gap-4">
                {kpis.map(([label, value, delta]) => (
                  <div key={label} className="rounded-xl border border-black/10 p-4"><p className="text-xs text-[#5b5968]">{label}</p><p className="text-3xl font-semibold">{value}</p><p className="text-xs text-[#5b5968]">{signed(delta)} vs October</p></div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-relaxed">{rows.length} posts were published in November. {top[0] ? `“${top[0].post.title}” performed best with ${pct(top[0].engagement)} engagement.` : ""} Figures are demo data until the Instagram account is connected.</p>
            </>
          ) : (
            <>
              <h2 className="mb-3 text-lg font-semibold">Top posts</h2>
              <ol className="mb-8 grid grid-cols-3 gap-4">
                {top.map((r) => (
                  <li key={r.post.id}><PostThumb post={r.post} tokens={tokens} /><p className="mt-2 text-sm font-medium">{r.post.title}</p><p className="text-xs text-[#5b5968]">{pct(r.engagement)} engagement · {r.reach.toLocaleString("en-IN")} reach</p></li>
                ))}
              </ol>
              <h2 className="mb-3 text-lg font-semibold">Next month&apos;s plan</h2>
              {plan.length === 0 ? <p className="text-sm text-[#5b5968]">December hasn&apos;t been planned yet.</p> : (
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">{plan.map((p) => <li key={p.id} className="flex justify-between gap-3"><span className="truncate">{p.title}</span><span className="shrink-0 text-[#5b5968]">{formatDayMonth(p.scheduledAt.slice(0, 10))}</span></li>)}</ul>
              )}
            </>
          )}
          <footer className="mt-10 text-xs text-[#5b5968]">Prepared by PostPilot · Neovia AI</footer>
        </section>
      ))}
    </div>
  );
}
