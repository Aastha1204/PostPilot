import type { BusinessType } from "@/lib/types";

export interface PostTheme {
  id: string;
  name: string;
  mood: string;
  palette: { bg: string; fg: string; accent: string; primary: string; secondary: string };
  motif: "rings" | "bokeh" | "rays" | "waves" | "confetti" | "petals";
  /** Fragment added to the image prompt so every picture in a post shares one look. */
  imageStyle: string;
  keywords: string[];
  businessTypes?: BusinessType[];
}

export const THEMES: PostTheme[] = [
  { id: "royal-gold", name: "Royal Gold", mood: "Regal, warm and ceremonial", palette: { bg: "#FBF6EC", fg: "#5A1020", accent: "#C9A227", primary: "#6E1423", secondary: "#C9A227" }, motif: "rings", imageStyle: "opulent Indian wedding décor, warm golden light, marigold and ivory flowers, rich maroon drapes, shallow depth of field", keywords: ["wedding", "shaadi", "mandap", "vivah", "reception", "sangeet", "engagement"], businessTypes: ["wedding_planner", "interior"] },
  { id: "festive-diya", name: "Festive Diya", mood: "Glowing, joyful and traditional", palette: { bg: "#2B0F05", fg: "#FFE9C2", accent: "#FF9A1F", primary: "#8A2D0B", secondary: "#FFC857" }, motif: "bokeh", imageStyle: "rows of glowing oil lamps, marigold garlands, rangoli, warm festive night glow", keywords: ["diwali", "deepavali", "festival", "puja", "navratri", "dussehra", "lakshmi"] },
  { id: "pastel-floral", name: "Pastel Floral", mood: "Soft, romantic and airy", palette: { bg: "#FFF4F6", fg: "#6B2D45", accent: "#E58FA8", primary: "#C45C80", secondary: "#F2B8C6" }, motif: "petals", imageStyle: "soft pastel flowers, blush pink and peach tones, airy natural window light, dreamy", keywords: ["haldi", "mehendi", "baby shower", "bridal shower", "mothers day", "women", "spring", "floral"] },
  { id: "midnight-gala", name: "Midnight Gala", mood: "Luxurious, celebratory and glamorous", palette: { bg: "#0C1024", fg: "#F4F1E8", accent: "#E5C76B", primary: "#1B2350", secondary: "#E5C76B" }, motif: "bokeh", imageStyle: "elegant night party, champagne gold sparkles, deep navy backdrop, cinematic lighting", keywords: ["new year", "nye", "gala", "party", "cocktail", "christmas eve", "countdown"] },
  { id: "neon-party", name: "Neon Party", mood: "Loud, young and energetic", palette: { bg: "#120B2E", fg: "#FFFFFF", accent: "#3DF2C8", primary: "#7A2CFF", secondary: "#FF4FD8" }, motif: "confetti", imageStyle: "neon lights, vibrant magenta and cyan glow, dance floor energy, confetti, dynamic angle", keywords: ["dj", "college", "disco", "concert", "fest", "freshers", "birthday party"] },
  { id: "minimal-mono", name: "Minimal Mono", mood: "Clean, modern and confident", palette: { bg: "#F5F5F2", fg: "#16181B", accent: "#16181B", primary: "#16181B", secondary: "#8A8A85" }, motif: "waves", imageStyle: "minimalist composition, neutral stone tones, lots of negative space, soft studio light", keywords: ["launch", "opening", "workshop", "webinar", "corporate", "announcement", "minimal"] },
  { id: "sunset-boho", name: "Sunset Boho", mood: "Earthy, relaxed and artistic", palette: { bg: "#FBEFE1", fg: "#5B2A14", accent: "#D9733B", primary: "#B5502A", secondary: "#E8A87C" }, motif: "rays", imageStyle: "boho styling, terracotta and sand tones, pampas grass, golden hour sunlight, handmade textures", keywords: ["cafe", "brunch", "market", "pop-up", "sunset", "boho", "outdoor"], businessTypes: ["cafe"] },
  { id: "fresh-green", name: "Fresh Green", mood: "Healthy, natural and energising", palette: { bg: "#F1F8EE", fg: "#17402A", accent: "#4CAF50", primary: "#2E7D4F", secondary: "#A5D6A7" }, motif: "waves", imageStyle: "fresh greenery, natural daylight, clean healthy lifestyle, leaves and water droplets", keywords: ["yoga", "health", "organic", "wellness", "earth day", "nutrition", "green"] },
  { id: "power-lime", name: "Power Lime", mood: "Bold, athletic and driven", palette: { bg: "#16181B", fg: "#FFFFFF", accent: "#B6F23A", primary: "#B6F23A", secondary: "#FFFFFF" }, motif: "rays", imageStyle: "dramatic gym lighting, dark charcoal background, electric lime highlights, motion and sweat, high contrast", keywords: ["gym", "fitness", "challenge", "marathon", "transformation", "workout", "january"], businessTypes: ["gym"] },
  { id: "retro-pop", name: "Retro Pop", mood: "Playful, nostalgic and colourful", palette: { bg: "#FFF3D6", fg: "#3B1D5A", accent: "#FF5A5F", primary: "#2E86DE", secondary: "#FFC93C" }, motif: "confetti", imageStyle: "retro 70s poster style, bold flat colours, playful shapes, halftone texture", keywords: ["sale", "offer", "discount", "festival sale", "flash", "retro", "kids"] },
  { id: "monsoon-blue", name: "Monsoon Blue", mood: "Calm, cosy and refreshing", palette: { bg: "#EAF4FB", fg: "#103A5A", accent: "#2E86DE", primary: "#1B5E92", secondary: "#9FD0F2" }, motif: "waves", imageStyle: "rainy window, cool blue tones, steaming cups, cosy mood, soft reflections", keywords: ["monsoon", "rain", "winter", "chai", "cosy", "holi"] },
  { id: "saffron-white", name: "Saffron & White", mood: "Proud, dignified and national", palette: { bg: "#FFFFFF", fg: "#1F3B2D", accent: "#F28C28", primary: "#138808", secondary: "#F28C28" }, motif: "rays", imageStyle: "saffron, white and green colour accents, respectful patriotic celebration, marigold petals, soft daylight, no flags with text", keywords: ["republic day", "independence day", "gandhi", "national", "tricolour", "patriot"] },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id: string | undefined): PostTheme | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Picks the best theme for an event from its wording, falling back to the business type. */
export function pickTheme(input: { name: string; type: string; notes?: string; businessType: BusinessType }): PostTheme {
  const text = `${input.name} ${input.type} ${input.notes ?? ""}`.toLowerCase();
  let best: { theme: PostTheme; score: number } | null = null;
  for (const theme of THEMES) {
    const score = theme.keywords.reduce((n, k) => n + (text.includes(k) ? 2 : 0), 0) + (theme.businessTypes?.includes(input.businessType) ? 1 : 0);
    if (score > 0 && (!best || score > best.score)) best = { theme, score };
  }
  return best?.theme ?? THEMES.find((t) => t.businessTypes?.includes(input.businessType)) ?? THEMES[0]!;
}
