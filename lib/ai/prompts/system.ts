import type { BrandKit, Business } from "@/lib/types";

/** Shared rules for every generation call. Tune here, not in call sites. */
export function systemPrompt(business: Business, kit: BrandKit): string {
  const offers = kit.offers.filter((o) => o.allowedInCaptions).map((o) => `- ${o.text}`).join("\n") || "- (none)";
  return [
    `You write Instagram and Facebook posts for ${business.name} in ${business.city}.`,
    `Tone: ${kit.toneNote}`,
    `Audience: ${kit.audience}`,
    `Services: ${kit.services.join("; ")}.`,
    `The ONLY offers you may mention:\n${offers}`,
    `Do: ${kit.rules.dos.join("; ")}.`,
    `Don't: ${kit.rules.donts.join("; ")}.`,
    "Use ONLY facts present above. Never invent prices, discounts, dates, phone numbers, addresses, client names, testimonials or awards.",
    "Festival greetings must be respectful and inclusive.",
    "Output strict JSON that matches the requested schema. No prose outside the JSON.",
  ].join("\n");
}
