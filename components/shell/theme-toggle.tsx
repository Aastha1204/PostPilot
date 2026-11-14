"use client";

import { Moon, Sun } from "lucide-react";
import { useDemoStore } from "@/lib/store";

export function ThemeToggle() {
  const theme = useDemoStore((s) => s.theme);
  const setTheme = useDemoStore((s) => s.setTheme);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
      className="grid size-9 place-items-center rounded-full border border-line bg-panel text-fg-muted hover:text-fg"
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
