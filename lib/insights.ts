import type { ContentPillar, Post } from "@/lib/types";

export interface PostInsightRow {
  post: Post;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  engagement: number;
}

export interface Totals {
  reach: number;
  engagementRate: number;
  saves: number;
  visits: number;
}

/** Previous-month baselines for the demo; real numbers come from the Instagram API in live mode. */
const BASELINE: Record<string, Totals> = {
  "shubh-vivah": { reach: 13400, engagementRate: 0.104, saves: 365, visits: 880 },
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

export function insightRows(posts: Post[], businessId: string, month: string): PostInsightRow[] {
  return posts
    .filter((p) => p.businessId === businessId && p.status === "published" && p.insight && p.scheduledAt.startsWith(month))
    .map((post) => {
      const i = post.insight!;
      return { post, reach: i.reach, likes: i.likes, comments: i.comments, saves: i.saves, engagement: i.reach ? (i.likes + i.comments + i.saves) / i.reach : 0 };
    });
}

export function totals(rows: PostInsightRow[]): Totals {
  const reach = rows.reduce((a, r) => a + r.reach, 0);
  const interactions = rows.reduce((a, r) => a + r.likes + r.comments + r.saves, 0);
  return { reach, engagementRate: reach ? interactions / reach : 0, saves: rows.reduce((a, r) => a + r.saves, 0), visits: Math.round(reach * 0.065) };
}

export function baselineFor(businessId: string): Totals | null {
  return BASELINE[businessId] ?? null;
}

export function change(now: number, before: number | undefined): number | null {
  return before ? (now - before) / before : null;
}

export function pillarPerformance(rows: PostInsightRow[], pillars: ContentPillar[]) {
  return pillars
    .map((p) => {
      const mine = rows.filter((r) => r.post.pillarId === p.id);
      return { name: p.name, colour: p.colour, reach: mine.length ? Math.round(mine.reduce((a, r) => a + r.reach, 0) / mine.length) : 0, posts: mine.length };
    })
    .filter((p) => p.posts > 0);
}

/** Day × hour (IST) score 0..1: an engagement model peaking late morning and evening, nudged by real post results. */
export function heatmap(rows: PostInsightRow[]): number[][] {
  const dayFactor = [0.82, 0.86, 0.82, 0.9, 0.95, 1, 0.92];
  const maxReach = Math.max(1, ...rows.map((r) => r.reach));
  const grid = DAYS.map((_, d) => HOURS.map((h) => (Math.exp(-((h - 11) ** 2) / 8) * 0.75 + Math.exp(-((h - 19.5) ** 2) / 6)) * dayFactor[d]!));
  for (const r of rows) {
    const date = new Date(`${r.post.scheduledAt.slice(0, 10)}T00:00:00Z`);
    const day = (date.getUTCDay() + 6) % 7;
    const hour = Number(r.post.scheduledAt.slice(11, 13));
    const col = HOURS.indexOf(hour);
    if (col >= 0) grid[day]![col]! += (r.reach / maxReach) * 0.4;
  }
  const peak = Math.max(...grid.flat());
  return grid.map((row) => row.map((v) => v / peak));
}

export function bestSlots(grid: number[][], count = 3): { day: string; hour: number; score: number }[] {
  return grid.flatMap((row, d) => row.map((score, h) => ({ day: DAYS[d]!, hour: HOURS[h]!, score }))).sort((a, b) => b.score - a.score).slice(0, count);
}

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const signed = (n: number | null) => (n === null ? "—" : `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`);
