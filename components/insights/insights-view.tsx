"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PostThumb } from "@/components/calendar/post-thumb";
import { useActiveBundle } from "@/components/providers";
import { PageHeader } from "@/components/ui/page-header";
import { DAYS, HOURS, baselineFor, bestSlots, change, heatmap, insightRows, pct, pillarPerformance, signed, totals } from "@/lib/insights";
import { useDemoStore } from "@/lib/store";
import { tokensFor } from "@/lib/templates/tokens";
import { cn } from "@/lib/utils/cn";
import { formatDayMonth } from "@/lib/utils/format";

type SortKey = "date" | "reach" | "engagement" | "saves";
const MONTH = "2026-11";

function Kpi({ label, value, delta }: { label: string; value: string; delta: number | null }) {
  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className={cn("mt-1 text-xs", delta === null ? "text-fg-muted" : delta >= 0 ? "text-green-500" : "text-red-400")}>{delta === null ? "No previous month" : `${signed(delta)} vs October`}</p>
    </div>
  );
}

export function InsightsView() {
  const bundle = useActiveBundle();
  const posts = useDemoStore((s) => s.posts);
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const rows = useMemo(() => insightRows(Object.values(posts), bundle.business.id, MONTH), [posts, bundle.business.id]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "reach", dir: -1 });

  const t = totals(rows);
  const base = baselineFor(bundle.business.id);
  const grid = useMemo(() => heatmap(rows), [rows]);
  const slots = bestSlots(grid);
  const sorted = [...rows].sort((a, b) => {
    const v = (r: typeof a) => (sort.key === "date" ? r.post.scheduledAt : sort.key === "reach" ? r.reach : sort.key === "saves" ? r.saves : r.engagement);
    return v(a) < v(b) ? -sort.dir : v(a) > v(b) ? sort.dir : 0;
  });
  const top = [...rows].sort((a, b) => b.engagement - a.engagement).slice(0, 3);
  const perf = pillarPerformance(rows, bundle.pillars);

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="p-3">
      <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))} className="inline-flex items-center gap-1">
        {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
      </button>
    </th>
  );

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Insights" description="Reach, engagement and the best times to post." />
        <p className="rounded-card border border-dashed border-line p-8 text-sm text-fg-muted">No published posts with results yet for {bundle.business.shortName}. Switch to Shubh Vivah to see a full November.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Insights" description="November 2026 · Demo data. Live mode pulls media insights from the Instagram API on a schedule.">
        <Link href="/insights/report?print=1" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"><Download className="size-4" aria-hidden /> Download monthly report</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Reach" value={t.reach.toLocaleString("en-IN")} delta={change(t.reach, base?.reach)} />
        <Kpi label="Engagement rate" value={pct(t.engagementRate)} delta={change(t.engagementRate, base?.engagementRate)} />
        <Kpi label="Saves" value={t.saves.toLocaleString("en-IN")} delta={change(t.saves, base?.saves)} />
        <Kpi label="Profile visits" value={t.visits.toLocaleString("en-IN")} delta={change(t.visits, base?.visits)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-card border border-line bg-panel p-4" aria-label="Pillar performance">
          <h2 className="mb-2 text-sm font-medium text-fg-muted">Average reach by pillar</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.05)" }} contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--fg)" }} />
                <Bar dataKey="reach" radius={[8, 8, 0, 0]} isAnimationActive={false}>{perf.map((p) => <Cell key={p.name} fill={p.colour} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-card border border-line bg-panel p-4" aria-label="Top posts">
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Top 3 posts by engagement</h2>
          <ol className="space-y-3">
            {top.map((r, i) => (
              <li key={r.post.id} className="flex items-center gap-3">
                <span className="w-4 text-sm text-fg-muted">{i + 1}</span>
                <span className="w-12 shrink-0"><PostThumb post={r.post} tokens={tokens} /></span>
                <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium">{r.post.title}</span><span className="text-xs text-fg-muted">{pct(r.engagement)} engagement · {r.reach.toLocaleString("en-IN")} reach</span></span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-4 rounded-card border border-line bg-panel p-4" aria-label="Best time to post">
        <h2 className="mb-1 text-sm font-medium text-fg-muted">Best time to post (IST)</h2>
        <p className="mb-3 text-xs text-fg-muted">Strongest slots: {slots.map((s) => `${s.day} ${String(s.hour).padStart(2, "0")}:00`).join(", ")}. Defaults to tune as more results arrive.</p>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1 text-[10px]">
            <thead><tr><th className="w-10" />{HOURS.map((h) => <th key={h} scope="col" className="w-8 font-normal text-fg-muted">{h}</th>)}</tr></thead>
            <tbody>
              {DAYS.map((d, di) => (
                <tr key={d}>
                  <th scope="row" className="pr-2 text-left font-normal text-fg-muted">{d}</th>
                  {HOURS.map((h, hi) => <td key={h} title={`${d} ${h}:00 · ${Math.round(grid[di]![hi]! * 100)}`} className="size-6 rounded-md" style={{ background: `color-mix(in srgb, var(--accent) ${Math.round(grid[di]![hi]! * 100)}%, var(--panel-2))` }} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 overflow-x-auto rounded-card border border-line bg-panel" aria-label="Per-post results">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs text-fg-muted"><tr><th scope="col" className="p-3">Post</th>{header("date", "Date")}{header("reach", "Reach")}{header("engagement", "Engagement")}{header("saves", "Saves")}<th scope="col">Likes</th><th scope="col">Comments</th></tr></thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.post.id} className="border-b border-line last:border-0">
                <td className="p-3"><Link href={`/posts/${r.post.id}`} className="hover:text-accent">{r.post.title}</Link></td>
                <td>{formatDayMonth(r.post.scheduledAt.slice(0, 10))}</td><td>{r.reach.toLocaleString("en-IN")}</td><td>{pct(r.engagement)}</td><td>{r.saves}</td><td>{r.likes}</td><td>{r.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
