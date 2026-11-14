import type { ContentPillar, Festival } from "@/lib/types";

export function planPrompt(input: { month: string; count: number; pillars: ContentPillar[]; festivals: Festival[]; existingTitles: string[] }): string {
  return [
    `Plan ${input.count} posts for ${input.month} (IST).`,
    `Pillars and target weights: ${input.pillars.map((p) => `${p.id} (${p.name}) ${p.weight}%`).join(", ")}.`,
    `Festivals this month: ${input.festivals.map((f) => `${f.id} on ${f.date}`).join(", ") || "none"}.`,
    "Rules: 3 to 5 posts per week, never the same pillar on consecutive posts, a festival greeting on each festival date.",
    `Avoid ideas similar to: ${input.existingTitles.join("; ") || "none"}.`,
    'Return JSON: {"slots":[{"date":"YYYY-MM-DD","pillarId":string,"format":"image"|"carousel"|"reel","ideaTitle":string,"festivalId"?:string}]}',
  ].join("\n");
}
