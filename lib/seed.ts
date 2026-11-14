import { z } from "zod";
import shubhVivah from "@/data/seed/businesses/shubh-vivah.json";
import chaiChapter from "@/data/seed/businesses/chai-chapter.json";
import forgeFitness from "@/data/seed/businesses/forge-fitness.json";
import { businessBundleSchema } from "./schemas";
import type { BusinessBundle } from "./types";

const bundles: BusinessBundle[] = z
  .array(businessBundleSchema)
  .parse([shubhVivah, chaiChapter, forgeFitness]);

export const DEFAULT_BUSINESS_ID = "shubh-vivah";

export function getSeedBundles(): BusinessBundle[] {
  return bundles;
}

export function getBundle(id: string): BusinessBundle {
  return bundles.find((b) => b.business.id === id) ?? (bundles[0] as BusinessBundle);
}
