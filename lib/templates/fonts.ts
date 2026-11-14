/** Fonts available to designs. `pkg` is the @fontsource package; used by the server renderer. */
export const FONT_LIBRARY: Record<string, { pkg: string; weights: number[] }> = {
  Inter: { pkg: "inter", weights: [400, 600] },
  "Cormorant Garamond": { pkg: "cormorant-garamond", weights: [500, 600, 700] },
  Mulish: { pkg: "mulish", weights: [400, 700] },
  Fredoka: { pkg: "fredoka", weights: [500, 600] },
  Nunito: { pkg: "nunito", weights: [400, 700] },
  "Barlow Condensed": { pkg: "barlow-condensed", weights: [600, 700] },
};

export const AVAILABLE_FONTS = Object.keys(FONT_LIBRARY);
