import type { BrandKit } from "@/lib/types";

type Tone = BrandKit["tone"];

/** Precomputed sample captions. Live mode will swap these for a debounced LLM rewrite. */
export function sampleCaption(tone: Tone, formality: number, subject: string): string {
  const level = formality < 34 ? 0 : formality < 67 ? 1 : 2;
  const s = subject.toLowerCase();
  const table: Record<Tone, string[]> = {
    english: [
      `Our ${s} setups are ready for the season ✨ Come take a look!`,
      `Planning your ${s}? Here is a setup we are proud of this season.`,
      `We are pleased to share one of our recent ${s} setups for the season.`,
    ],
    hinglish: [
      `Season ke liye ${s} ekdum ready hai ✨ Aaiye, dekhiye!`,
      `${s} plan kar rahe hain? Ye raha is season ka humara favourite setup.`,
      `Is season ke humare ${s} setups ki ek jhalak aapke saamne pesh hai.`,
    ],
    marathi_mix: [
      `Season sathi ${s} ekdum tayyar aahe ✨ Ya, pahayla!`,
      `${s} plan kartay ka? Ha ya season cha aamcha avadta setup.`,
      `Ya season che aamche ${s} setups tumchya samor sadar karat aahot.`,
    ],
  };
  return table[tone][level]!;
}
