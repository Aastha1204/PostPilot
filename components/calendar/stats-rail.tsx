"use client";

import { Cell, Pie, PieChart } from "recharts";
import { FORMAT_META } from "./status";
import { startOfWeek } from "@/lib/utils/dates";
import { postDate } from "@/lib/utils/dates";
import type { ContentPillar, Post, PostFormat } from "@/lib/types";

export function StatsRail({ posts, pillars }: { posts: Post[]; pillars: ContentPillar[] }) {
  const total = posts.length;
  const mix = pillars.map((p) => ({ ...p, count: posts.filter((x) => x.pillarId === p.id).length }));
  const formats = (Object.keys(FORMAT_META) as PostFormat[]).map((f) => ({ f, count: posts.filter((p) => p.format === f).length }));
  const weeks = new Map<string, Set<string>>();
  for (const p of posts) {
    const d = postDate(p.scheduledAt);
    const key = startOfWeek(d);
    weeks.set(key, (weeks.get(key) ?? new Set()).add(d));
  }
  const days = [...weeks.values()].map((s) => s.size);
  const avgDays = days.length ? (days.reduce((a, b) => a + b, 0) / days.length).toFixed(1) : "0";

  return (
    <aside aria-label="Month stats" className="space-y-4">
      <section className="rounded-card border border-line bg-panel p-4">
        <h2 className="mb-2 text-sm font-medium text-fg-muted">Pillar mix vs target</h2>
        <div className="flex justify-center">
          <PieChart width={150} height={150} aria-label="Pillar mix donut">
            <Pie data={total ? mix : [{ id: "none", count: 1, colour: "#2a2a35" }]} dataKey="count" innerRadius={44} outerRadius={68} stroke="none" isAnimationActive={false}>
              {(total ? mix : [{ id: "none", colour: "#2a2a35" }]).map((m) => <Cell key={m.id} fill={m.colour} />)}
            </Pie>
          </PieChart>
        </div>
        <ul className="mt-2 space-y-1.5 text-xs">
          {mix.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: m.colour }} aria-hidden />{m.name}</span>
              <span className="text-fg-muted">{total ? Math.round((m.count / total) * 100) : 0}% / {m.weight}%</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-card border border-line bg-panel p-4">
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Format mix</h2>
        <ul className="space-y-2 text-xs">
          {formats.map(({ f, count }) => (
            <li key={f}>
              <div className="mb-1 flex justify-between"><span>{FORMAT_META[f].label}</span><span className="text-fg-muted">{count}</span></div>
              <div className="h-1.5 rounded-full bg-panel-2"><div className="h-full rounded-full bg-accent" style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-card border border-line bg-panel p-4">
        <h2 className="text-sm font-medium text-fg-muted">Posting days per week</h2>
        <p className="mt-1 text-2xl font-semibold">{avgDays}</p>
      </section>
    </aside>
  );
}
