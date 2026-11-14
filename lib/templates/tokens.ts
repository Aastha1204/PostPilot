import { getTheme } from "@/lib/themes";
import type { BusinessBundle } from "@/lib/types";
import { luminance, mix, readableOn } from "@/lib/utils/color";
import { initials } from "@/lib/utils/format";

export type DesignStyle = "ornate" | "friendly" | "bold";

export interface DesignTokens {
  style: DesignStyle;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  onAccent: string;
  primary: string;
  secondary: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: 500 | 600 | 700;
  uppercase: boolean;
  radius: number;
  shortName: string;
  handle: string;
  monogram: string;
  watermark: boolean;
}

const STYLE_BY_TYPE = {
  wedding_planner: "ornate",
  interior: "ornate",
  cafe: "friendly",
  salon: "friendly",
  coaching: "friendly",
  gym: "bold",
} as const;

/** Single place that turns a brand kit into design colours; templates never read the kit directly. */
export function tokensFor({ business, brandKit }: Pick<BusinessBundle, "business" | "brandKit">): DesignTokens {
  const { primary, secondary, surface, accent } = brandKit.colours;
  const dark = luminance(surface) < 0.2;
  const style: DesignStyle = dark ? "bold" : STYLE_BY_TYPE[business.type];

  let fg: string;
  let accentColour: string;
  if (dark) {
    fg = secondary;
    accentColour = primary;
  } else if (style === "ornate") {
    fg = primary;
    accentColour = secondary;
  } else {
    fg = accent ?? primary;
    accentColour = primary;
  }

  return {
    style,
    bg: surface,
    fg,
    muted: mix(fg, surface, 0.4),
    accent: accentColour,
    onAccent: luminance(accentColour) > 0.35 ? "#16181B" : "#FFFFFF",
    primary,
    secondary,
    headingFont: brandKit.fonts.heading,
    bodyFont: brandKit.fonts.body,
    headingWeight: style === "bold" ? 700 : style === "friendly" ? 500 : 600,
    uppercase: style === "bold",
    radius: style === "friendly" ? 44 : style === "ornate" ? 6 : 0,
    shortName: business.shortName,
    handle: business.handle,
    monogram: initials(business.shortName),
    watermark: true,
  };
}

/** Per-post design options: three colour variants and the logo watermark toggle. */
export function withDesignOptions(t: DesignTokens, options: { variant: number; watermark: boolean; themeId?: string }): DesignTokens {
  const themed = applyTheme(t, options.themeId);
  const base = { ...themed, watermark: options.watermark };
  if (options.variant === 1) {
    const fg = readableOn(themed.primary) === "#FFFFFF" ? themed.bg : "#16181B";
    const accent = themed.style === "ornate" ? themed.secondary : fg;
    return { ...base, bg: themed.primary, fg, accent, muted: mix(fg, themed.primary, 0.35), onAccent: readableOn(accent) };
  }
  if (options.variant === 2) return { ...base, bg: mix(themed.bg, themed.accent, 0.2) };
  return base;
}

/** Re-colours a design with an event theme while keeping the brand's fonts. */
export function applyTheme(t: DesignTokens, themeId: string | undefined): DesignTokens {
  const theme = getTheme(themeId);
  if (!theme) return t;
  const { bg, fg, accent, primary, secondary } = theme.palette;
  return { ...t, bg, fg, accent, primary, secondary, muted: mix(fg, bg, 0.45), onAccent: luminance(accent) > 0.35 ? "#16181B" : "#FFFFFF" };
}
