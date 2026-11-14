"use client";

import { Search } from "lucide-react";
import { useActiveBundle } from "@/components/providers";
import { useDemoStore } from "@/lib/store";
import { initials } from "@/lib/utils/format";
import { BusinessSwitcher } from "./business-switcher";
import { ModePill } from "./mode-pill";
import { NotificationsBell } from "./notifications-bell";
import { ResetButton } from "./reset-button";
import { ThemeToggle } from "./theme-toggle";

interface Props {
  liveAvailable: boolean;
  missing: string[];
}

export function Topbar({ liveAvailable, missing }: Props) {
  const { business } = useActiveBundle();
  return (
    <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 px-4 sm:px-6">
      <BusinessSwitcher />
      <button type="button" onClick={() => useDemoStore.getState().setPaletteOpen(true)} className="ml-auto hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-fg-muted hover:text-fg md:inline-flex">
        <Search className="size-3.5" aria-hidden /> Search or run a command <kbd className="rounded border border-line px-1.5 text-[10px]">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <ModePill liveAvailable={liveAvailable} missing={missing} />
        <ResetButton />
        <ThemeToggle />
        <NotificationsBell />
        <span
          role="img"
          aria-label={`Signed in as ${business.ownerName}`}
          className="grid size-9 place-items-center rounded-full bg-accent text-xs font-semibold text-on-accent"
        >
          {initials(business.ownerName)}
        </span>
      </div>
    </header>
  );
}
