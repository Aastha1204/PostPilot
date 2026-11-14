import { z } from "zod";
import { FAMILY_IDS, templateContentSchema } from "./templates/schema";

export const businessTypeSchema = z.enum([
  "wedding_planner",
  "cafe",
  "gym",
  "salon",
  "coaching",
  "interior",
]);

export const businessSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  type: businessTypeSchema,
  timezone: z.literal("Asia/Kolkata"),
  ownerName: z.string(),
  ownerWhatsapp: z.string(),
  handle: z.string(),
  tagline: z.string(),
  createdAt: z.string(),
});

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const brandKitSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  colours: z.object({
    primary: hex,
    secondary: hex,
    surface: hex,
    accent: hex.optional(),
  }),
  fonts: z.object({ heading: z.string(), body: z.string() }),
  logoUrl: z.string().nullable(),
  tone: z.enum(["english", "hinglish", "marathi_mix"]),
  toneNote: z.string(),
  languages: z.array(z.string()),
  services: z.array(z.string()).min(1),
  offers: z.array(z.object({ text: z.string(), allowedInCaptions: z.boolean() })),
  audience: z.string(),
  hashtagSets: z.array(z.object({ name: z.string(), tags: z.array(z.string()) })),
  rules: z.object({ dos: z.array(z.string()), donts: z.array(z.string()) }),
  cta: z.string(),
  formality: z.number().min(0).max(100).default(50),
  preferredHashtagCount: z.number().int().min(1).max(30).default(12),
});

export const contentPillarSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(100),
  colour: hex,
});

export const businessBundleSchema = z
  .object({
    business: businessSchema,
    brandKit: brandKitSchema,
    pillars: z.array(contentPillarSchema).min(1),
  })
  .refine((b) => b.pillars.reduce((sum, p) => sum + p.weight, 0) === 100, {
    message: "Pillar weights must add up to 100",
  });

export const festivalSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  region: z.string(),
  applicableBusinessTypes: z.array(businessTypeSchema),
  greetingStyle: z.string(),
  requiresManualReview: z.literal(true),
  verified: z.boolean(),
});

export const festivalFileSchema = z.array(festivalSchema);

export const appModeSchema = z.enum(["demo", "live"]);

export const postStatusSchema = z.enum(["draft", "awaiting_approval", "approved", "scheduled", "publishing", "published", "failed", "skipped"]);

export const factFlagSchema = z.object({
  kind: z.string(),
  text: z.string(),
  status: z.enum(["ok", "warn"]),
});

export const timelineEntrySchema = z.object({ status: postStatusSchema, at: z.string(), note: z.string().optional() });

export const postSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  pillarId: z.string(),
  format: z.enum(["image", "carousel", "reel"]),
  title: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string(),
  visualBrief: z.string(),
  templateId: z.enum(FAMILY_IDS),
  templateProps: templateContentSchema,
  photoTags: z.array(z.string()),
  scheduledAt: z.string(),
  status: postStatusSchema,
  platforms: z.array(z.enum(["instagram", "facebook", "linkedin", "x"])),
  themeId: z.string().optional(),
  source: z.enum(["manual", "event"]).optional(),
  autoApproved: z.boolean().optional(),
  factFlags: z.array(factFlagSchema),
  variant: z.number().int().min(0).max(2).default(0),
  watermark: z.boolean().default(true),
  factConfirmed: z.array(z.string()).default([]),
  timeline: z.array(timelineEntrySchema).default([]),
  festivalId: z.string().optional(),
  error: z.string().optional(),
  fbPostId: z.string().optional(),
  igMediaId: z.string().optional(),
  insight: z.object({ reach: z.number(), likes: z.number(), comments: z.number(), saves: z.number() }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
