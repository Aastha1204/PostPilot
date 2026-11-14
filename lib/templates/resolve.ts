import { getBundle } from "@/lib/seed";
import { FAMILIES, FAMILY_IDS, type CanvasSize, type FamilyId, type TemplateContent } from "./schema";
import { sampleContent } from "./samples";
import { tokensFor, type DesignTokens } from "./tokens";

export interface ResolvedDesign {
  family: FamilyId;
  tokens: DesignTokens;
  content: TemplateContent;
  size: CanvasSize;
}

/**
 * Maps a render id to a design. Phase 2 serves `sample-<family>`;
 * real post ids are resolved here once posts exist.
 */
export function resolveDesign(postId: string, businessId: string, size?: CanvasSize): ResolvedDesign | null {
  const match = /^sample-(.+)$/.exec(postId);
  const family = FAMILY_IDS.find((id) => id === match?.[1]);
  if (!family) return null;
  const bundle = getBundle(businessId);
  const info = FAMILIES.find((f) => f.id === family);
  return {
    family,
    tokens: tokensFor(bundle),
    content: sampleContent(bundle, family),
    size: size ?? info?.size ?? "feed",
  };
}
