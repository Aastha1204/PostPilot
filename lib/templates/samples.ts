import type { BusinessBundle } from "@/lib/types";
import type { FamilyId, TemplateContent } from "./schema";

type Samples = Record<FamilyId, TemplateContent>;

function offer(bundle: BusinessBundle, index = 0): string {
  const allowed = bundle.brandKit.offers.filter((o) => o.allowedInCaptions);
  return allowed[index]?.text ?? allowed[0]?.text ?? "";
}

const SAMPLES: Record<string, (b: BusinessBundle) => Samples> = {
  "shubh-vivah": (b) => ({
    festival: { headline: "Shubh Tulsi Vivah", subhead: "Wedding season ki mangal shuruaat. Aapke parivaar ko dher saari shubhkamnayein.", badge: "21 Nov" },
    offer: { headline: "Book your December date", badge: "Offer", body: offer(b, 0), cta: b.brandKit.cta },
    "tip-carousel": {
      headline: "4 mandap planning tips",
      subhead: "Swipe for what to decide first",
      cta: b.brandKit.cta,
      slides: [
        { title: "Fix the venue layout first", body: "Mandap placement decides every other setup." },
        { title: "Pick a colour story", body: "Two main colours and one accent keep décor elegant." },
        { title: "Plan the floral entry", body: "Decide varmala and entry flowers early." },
        { title: "Book a site visit", body: b.brandKit.cta },
      ],
    },
    testimonial: { headline: "Client story", quote: "Sample quote: the haldi setup felt just like we imagined.", attribution: "Name shared with family's permission" },
    "before-after": { headline: "Empty hall to sangeet stage", beforeLabel: "Before", afterLabel: "After", subhead: "Sangeet stage design" },
    portfolio: { headline: "Floral mandap, ivory and gold", subhead: "Mandap décor by Shubh Vivah", badge: "Portfolio" },
    "reel-cover": { headline: "Mandap setup, start to finish", subhead: "Behind the scenes", badge: "Reel" },
    "photo-story": { headline: "Your event, in pictures", subhead: "AI-generated or your own photos", badge: "Event", aiVisual: true },
  }),
  "chai-chapter": (b) => ({
    festival: { headline: "Happy Makar Sankranti", subhead: "Tilgul ghya, goad goad bola! Chai pe milte hain.", badge: "14 Jan" },
    offer: { headline: "Tuesday chai time", badge: "Offer", body: offer(b), cta: b.brandKit.cta },
    "tip-carousel": {
      headline: "4 ways to order your cutting chai",
      subhead: "Swipe, sip, repeat",
      cta: b.brandKit.cta,
      slides: [
        { title: "Classic cutting", body: "Strong, sweet and shared." },
        { title: "Add a bun maska", body: "Pair it with all-day breakfast." },
        { title: "Order on WhatsApp", body: "Cloud kitchen delivery in Thane." },
        { title: "Walk in", body: b.brandKit.cta },
      ],
    },
    testimonial: { headline: "Customer moment", quote: "Sample quote: our Sunday spot for chai and long chats.", attribution: "Regular, shared with permission" },
    "before-after": { headline: "Counter glow-up", beforeLabel: "Before", afterLabel: "After", subhead: "Behind the counter" },
    portfolio: { headline: "Filter coffee, fresh pour", subhead: "Menu highlight", badge: "Menu" },
    "reel-cover": { headline: "How we make cutting chai", subhead: "Behind the counter", badge: "Reel" },
    "photo-story": { headline: "Your event, in pictures", subhead: "AI-generated or your own photos", badge: "Event", aiVisual: true },
  }),
  "forge-fitness": (b) => ({
    festival: { headline: "Happy Republic Day", subhead: "Strong body, strong nation. Train with pride.", badge: "26 Jan" },
    offer: { headline: "Start the year strong", badge: "Offer", body: offer(b), cta: b.brandKit.cta },
    "tip-carousel": {
      headline: "4 form checks for your squat",
      subhead: "Swipe before your next leg day",
      cta: b.brandKit.cta,
      slides: [
        { title: "Brace your core", body: "Breathe in and tighten before you descend." },
        { title: "Knees track toes", body: "Keep them in line with your feet." },
        { title: "Chest up", body: "Eyes forward, spine long." },
        { title: "Ask a coach", body: b.brandKit.cta },
      ],
    },
    testimonial: { headline: "Member story", quote: "Sample quote: showing up every week changed my routine.", attribution: "Member, shared with consent" },
    "before-after": { headline: "Member progress, with consent", beforeLabel: "Week 1", afterLabel: "Week 12", subhead: "Shared with written consent" },
    portfolio: { headline: "Strength floor, Dombivli", subhead: "Strength training", badge: "Studio" },
    "reel-cover": { headline: "Trainer's Monday warm-up", subhead: "Trainer spotlight", badge: "Reel" },
    "photo-story": { headline: "Your event, in pictures", subhead: "AI-generated or your own photos", badge: "Event", aiVisual: true },
  }),
};

export function sampleContent(bundle: BusinessBundle, family: FamilyId): TemplateContent {
  const build = SAMPLES[bundle.business.id];
  const generic = (): Samples => SAMPLES["shubh-vivah"]!(bundle);
  return (build ? build(bundle) : generic())[family];
}
