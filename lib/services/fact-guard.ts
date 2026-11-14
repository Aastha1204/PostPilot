import { festivalsFor } from "@/lib/festivals";
import type { BusinessBundle, FactFlag } from "@/lib/types";

const MONTHS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const UNITS = "days?|din|hours?|ghante|ghanta|weeks?|hafte|months?|mahine|years?|saal|guests?|mehmaan|people|log|events?|weddings?|shaadiyan|clients?|families|setups?";

const EXTRACTORS: { kind: string; re: RegExp }[] = [
  { kind: "amount", re: /(?:₹|rs\.?|inr)\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|lakh|lakhs|cr))?/gi },
  { kind: "percent", re: /\d+(?:\.\d+)?\s?%/g },
  { kind: "phone", re: /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g },
  { kind: "handle", re: /(?<![\w#])@\w[\w.]+/g },
  { kind: "date", re: new RegExp(`\\b(?:\\d{1,2}\\s)?(?:${MONTHS})[a-z]*\\s?[–-]\\s?(?:${MONTHS})[a-z]*(?:\\s\\d{4})?|\\b\\d{1,2}\\s(?:${MONTHS})[a-z]*(?:\\s\\d{4})?|\\b\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?\\b`, "gi") },
  { kind: "time", re: /\b\d{1,2}(?::\d{2})?\s?(?:[–-]\s?\d{1,2}(?::\d{2})?\s?)?(?:am|pm)\b/gi },
  { kind: "duration", re: new RegExp(`\\b\\d+\\+?\\s?(?:${UNITS})\\b`, "gi") },
];

const norm = (s: string) => s.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

/** Everything the brand kit (and festival calendar) says is true. */
function knownFacts(bundle: BusinessBundle): string {
  const { business, brandKit } = bundle;
  const festivalDates = festivalsFor(business.type).map((f) => {
    const [, m, d] = f.date.split("-");
    return `${Number(d)} ${MONTHS.split("|")[Number(m) - 1]}`;
  });
  return norm(
    [
      business.name, business.city, business.handle, business.ownerWhatsapp,
      ...brandKit.offers.filter((o) => o.allowedInCaptions).map((o) => o.text),
      ...brandKit.services, brandKit.audience, brandKit.cta, ...festivalDates,
    ].join(" | "),
  );
}

/** Finds numbers, ₹ amounts, percentages, dates, times, phones and handles; marks each ok or warn. */
export function checkFacts(text: string, bundle: BusinessBundle): FactFlag[] {
  const known = knownFacts(bundle);
  const flags: FactFlag[] = [];
  let remaining = text;
  for (const { kind, re } of EXTRACTORS) {
    for (const match of remaining.matchAll(re)) {
      const found = match[0].trim();
      flags.push({ kind, text: found, status: known.includes(norm(found)) ? "ok" : "warn" });
    }
    remaining = remaining.replace(re, " "); // mask so later extractors don't double count
  }
  return flags.filter((f, i) => flags.findIndex((g) => g.text === f.text && g.kind === f.kind) === i);
}

/** Warnings the owner has not fixed or explicitly confirmed. */
export function unresolved(flags: FactFlag[], confirmed: string[]): FactFlag[] {
  return flags.filter((f) => f.status === "warn" && !confirmed.includes(f.text));
}
