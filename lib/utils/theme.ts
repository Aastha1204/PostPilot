import type { BusinessBundle, ThemeMode } from "@/lib/types";
import { ensureContrast, pickAccent, readableOn } from "./color";

/** Brand kit to the CSS variables the whole UI is themed with. */
export function brandCssVars(bundle: BusinessBundle, theme: ThemeMode): Record<string, string> {
  const { primary, secondary, surface } = bundle.brandKit.colours;
  const panel = theme === "dark" ? "#13131a" : "#ffffff";
  const accent = ensureContrast(pickAccent(primary, secondary, theme === "dark"), panel);
  return {
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-surface": surface,
    "--accent": accent,
    "--on-accent": readableOn(accent),
  };
}
