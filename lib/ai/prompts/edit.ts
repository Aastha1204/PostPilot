export const EDIT_ACTIONS = {
  shorter: "Make the caption shorter. Keep the hook and the CTA.",
  festive: "Make the caption more festive while staying classy.",
  hinglish: "Make the caption more Hinglish (Hindi in Roman script mixed with English).",
  formal: "Make the caption more formal and polished. Fewer emoji.",
} as const;

export type EditAction = keyof typeof EDIT_ACTIONS;

export function editPrompt(post: { caption: string; hashtags: string[]; cta: string }, instruction: string): string {
  return [
    `Instruction from the business owner: ${instruction}`,
    "Follow the same fact rules: do not add prices, discounts, dates, phone numbers, names or claims that are not in the brand kit.",
    `Current caption:\n${post.caption}`,
    `Current hashtags: ${post.hashtags.join(" ")}`,
    `CTA: ${post.cta}`,
    'Return JSON: {"caption":string,"hashtags":string[],"cta":string,"summary":string} where summary is one line describing the change.',
  ].join("\n\n");
}
