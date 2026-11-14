import type { DesignTokens } from "@/lib/templates/tokens";
import { CANVAS, type CanvasSize, type FamilyId, type TemplateContent } from "@/lib/templates/schema";
import { BeforeAfter, Festival, Offer, Portfolio, PhotoStory, ReelCover, Testimonial, TipCarousel, type FamilyProps } from "./families";

const FAMILY_COMPONENTS: Record<FamilyId, (p: FamilyProps) => React.JSX.Element> = {
  festival: Festival,
  offer: Offer,
  "tip-carousel": TipCarousel,
  testimonial: Testimonial,
  "before-after": BeforeAfter,
  portfolio: Portfolio,
  "reel-cover": ReelCover,
  "photo-story": PhotoStory,
};

export interface TemplateProps {
  family: FamilyId;
  tokens: DesignTokens;
  content: TemplateContent;
  size?: CanvasSize;
  slide?: number;
}

/** Single source of truth for a design: the browser preview and the server renderer both draw this. */
export function Template({ family, tokens, content, size = "feed", slide = 0 }: TemplateProps) {
  const { width, height } = CANVAS[size];
  const Component = FAMILY_COMPONENTS[family];
  return <Component t={tokens} c={content} w={width} h={height} slide={slide} />;
}
