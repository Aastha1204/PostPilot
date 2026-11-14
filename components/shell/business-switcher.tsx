"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "@/lib/store";
import { getSeedBundles } from "@/lib/seed";
import { useActiveBundle } from "@/components/providers";
import { BusinessLogo } from "./business-logo";

export function BusinessSwitcher() {
  const active = useActiveBundle();
  const setActive = useDemoStore((s) => s.setActiveBusiness);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-2.5 py-1.5 text-left hover:bg-panel-2"
      >
        <BusinessLogo business={active.business} kit={active.brandKit} />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium">{active.business.name}</span>
          <span className="block truncate text-xs text-fg-muted">{active.business.city}</span>
        </span>
        <ChevronsUpDown className="size-4 text-fg-muted" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Switch demo business"
          className="glass absolute left-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl p-1.5 shadow-2xl"
        >
          {getSeedBundles().map(({ business, brandKit }) => {
            const selected = business.id === active.business.id;
            return (
              <li key={business.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(business.id);
                    setOpen(false);
                    toast.success(`Switched to ${business.name}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-panel-2"
                >
                  <BusinessLogo business={business} kit={brandKit} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{business.name}</span>
                    <span className="block truncate text-xs text-fg-muted">{business.city}</span>
                  </span>
                  {selected && <Check className="size-4 text-accent" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
