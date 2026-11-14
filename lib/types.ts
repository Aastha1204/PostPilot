import type { z } from "zod";
import type {
  appModeSchema,
  brandKitSchema,
  businessBundleSchema,
  businessSchema,
  businessTypeSchema,
  contentPillarSchema,
  festivalSchema,
} from "./schemas";

export type BusinessType = z.infer<typeof businessTypeSchema>;
export type Business = z.infer<typeof businessSchema>;
export type BrandKit = z.infer<typeof brandKitSchema>;
export type ContentPillar = z.infer<typeof contentPillarSchema>;
export type BusinessBundle = z.infer<typeof businessBundleSchema>;
export type Festival = z.infer<typeof festivalSchema>;
export type AppMode = z.infer<typeof appModeSchema>;

export type PostFormat = "image" | "carousel" | "reel";

export type PostStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "skipped";

export type Platform = "instagram" | "facebook" | "linkedin" | "x";

export type ThemeMode = "dark" | "light";

export type GenerationSpeed = "realistic" | "fast";

export type Post = import("zod").infer<typeof import("./schemas").postSchema>;
export type FactFlag = Post["factFlags"][number];
export type TimelineEntry = Post["timeline"][number];
