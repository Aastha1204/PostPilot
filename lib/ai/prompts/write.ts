export interface Slot {
  date: string;
  pillarId: string;
  format: "image" | "carousel" | "reel";
  ideaTitle: string;
  festivalId?: string;
}

export function writePrompt(slot: Slot, hashtagSets: string[], cta: string): string {
  return [
    `Write the post for: "${slot.ideaTitle}" (${slot.format}, pillar ${slot.pillarId}, ${slot.date}).`,
    "Caption: a hook line, then 2 to 4 short lines, then the CTA.",
    `CTA to use: ${cta}`,
    `Hashtags: choose from these brand tags plus at most 3 contextual ones: ${hashtagSets.join(" ")}.`,
    "templateId must be one of: festival, offer, tip-carousel, testimonial, before-after, portfolio, reel-cover.",
    'Return JSON: {"caption":string,"hashtags":string[],"cta":string,"visualBrief":string,"templateId":string,"headline":string,"subhead"?:string,"body"?:string,"badge"?:string,"slides"?:[{"title":string,"body":string}]}',
  ].join("\n");
}
