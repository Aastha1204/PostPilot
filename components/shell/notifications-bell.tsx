"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useActiveBundle } from "@/components/providers";

export function NotificationsBell() {
  const { business } = useActiveBundle();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    `${business.ownerName.split(" ")[0]} ji's weekly previews go out Monday 10:00 IST`,
    "Festival dates are unverified. Check them against a panchang before client release",
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-full border border-line bg-panel text-fg-muted hover:text-fg"
      >
        <Bell className="size-4" aria-hidden />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
      </button>
      {open && (
        <div className="glass absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl p-3 shadow-2xl">
          <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Notifications</p>
          <ul className="space-y-1">
            {items.map((text) => (
              <li key={text} className="rounded-xl px-2 py-2 text-sm hover:bg-panel-2">
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
