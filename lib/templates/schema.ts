import { z } from "zod";

/** Stable props contract: production can move rendering to Playwright without touching callers. */
export const templateContentSchema = z.object({
  headline: z.string().max(120),
  subhead: z.string().max(220).optional(),
  body: z.string().max(400).optional(),
  badge: z.string().max(40).optional(),
  cta: z.string().max(80).optional(),
  quote: z.string().max(300).optional(),
  attribution: z.string().max(80).optional(),
  beforeLabel: z.string().max(24).optional(),
  afterLabel: z.string().max(24).optional(),
  slides: z.array(z.object({ title: z.string().max(80), body: z.string().max(240) })).max(5).optional(),
  photoUrl: z.string().nullable().optional(),
  photoUrls: z.array(z.string()).max(6).optional(),
  aiVisual: z.boolean().optional(),
});

export type TemplateContent = z.infer<typeof templateContentSchema>;

export const FAMILY_IDS = ["festival", "offer", "tip-carousel", "testimonial", "before-after", "portfolio", "reel-cover", "photo-story"] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export type CanvasSize = "feed" | "square" | "reel";

export const CANVAS: Record<CanvasSize, { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  reel: { width: 1080, height: 1920 },
};

export interface FamilyInfo {
  id: FamilyId;
  label: string;
  blurb: string;
  format: "image" | "carousel" | "reel";
  size: CanvasSize;
  sampleNote?: string;
}

export const FAMILIES: FamilyInfo[] = [
  { id: "festival", label: "Festival greeting", blurb: "Respectful greetings on festival dates.", format: "image", size: "feed" },
  { id: "offer", label: "Offer post", blurb: "Only offers listed in the brand kit.", format: "image", size: "feed" },
  { id: "tip-carousel", label: "Tip carousel", blurb: "3 to 5 swipeable slides.", format: "carousel", size: "feed" },
  { id: "testimonial", label: "Testimonial card", blurb: "A real client quote, shared with permission.", format: "image", size: "feed", sampleNote: "Sample wording. Replace with a real quote before use." },
  { id: "before-after", label: "Before / after", blurb: "Two photos, one story.", format: "image", size: "feed", sampleNote: "Photo slots await real client photos." },
  { id: "portfolio", label: "Portfolio frame", blurb: "A real setup, framed.", format: "image", size: "feed" },
  { id: "photo-story", label: "Photo story", blurb: "AI-generated or your own photos, full-bleed, one per slide.", format: "carousel", size: "feed", sampleNote: "Photo slots fill with generated images when you plan an event." },
  { id: "reel-cover", label: "Reel cover", blurb: "Cover frame for a 9:16 reel.", format: "reel", size: "reel" },
];
