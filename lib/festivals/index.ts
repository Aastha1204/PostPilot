import { festivalFileSchema } from "@/lib/schemas";
import festivals20262027 from "@/data/festivals/2026-2027.json";
import type { BusinessType, Festival } from "@/lib/types";

// Each festival file covers a season; add the next file here, never inline in components.
const files: Record<string, unknown> = {
  "2026-2027": festivals20262027,
};

export function loadFestivals(season = "2026-2027"): Festival[] {
  return festivalFileSchema.parse(files[season] ?? []);
}

export function festivalsFor(type: BusinessType, season = "2026-2027"): Festival[] {
  return loadFestivals(season)
    .filter((f) => f.applicableBusinessTypes.includes(type))
    .sort((a, b) => a.date.localeCompare(b.date));
}
