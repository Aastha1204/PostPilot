"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { useDemoStore } from "@/lib/store";
import { getBundle } from "@/lib/seed";
import { brandCssVars } from "@/lib/utils/theme";
import type { BusinessBundle } from "@/lib/types";

/** Active business bundle with any brand kit edits applied; the seed default until the store has hydrated. */
export function useActiveBundle(): BusinessBundle {
  const id = useDemoStore((s) => s.activeBusinessId);
  const override = useDemoStore((s) => s.brandOverrides[id]);
  return useMemo(() => {
    const seed = getBundle(id);
    return override ? { ...seed, brandKit: { ...seed.brandKit, ...override } } : seed;
  }, [id, override]);
}

function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void Promise.resolve(useDemoStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);
  return hydrated;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function CursorRing() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  if (!pos) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[100] size-10 rounded-full border-2 border-accent/80 bg-accent/10"
      style={{ left: pos.x - 20, top: pos.y - 20 }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const bundle = useActiveBundle();
  const theme = useDemoStore((s) => s.theme);
  const presentation = useDemoStore((s) => s.presentation);
  const togglePresentation = useDemoStore((s) => s.togglePresentation);

  // Brand kit -> CSS variables. Colours glide because the class below transitions them.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    for (const [name, value] of Object.entries(brandCssVars(bundle, theme))) root.style.setProperty(name, value);
  }, [bundle, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const firstPresentation = useRef(true);
  useEffect(() => {
    document.documentElement.classList.toggle("presentation", presentation);
    if (firstPresentation.current) firstPresentation.current = false;
    else toast(presentation ? "Presentation mode on" : "Presentation mode off", { description: presentation ? "Press P to exit." : undefined });
  }, [presentation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) {
        togglePresentation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePresentation]);

  return (
    <div data-hydrated={hydrated}>
      {children}
      {presentation && <CursorRing />}
      <Toaster theme={theme} position="bottom-right" richColors closeButton />
    </div>
  );
}
