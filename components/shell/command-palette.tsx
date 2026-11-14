"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { enqueuePost, pickNextApproved } from "@/lib/publishing/runner";
import { getSeedBundles } from "@/lib/seed";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";

interface Command {
  id: string;
  label: string;
  group: "Go to" | "Actions" | "Switch business";
  run: () => void;
}

const SCREENS = [["Calendar", "/calendar"], ["Autopilot", "/autopilot"], ["Approvals", "/approvals"], ["Posts", "/posts"], ["Templates", "/templates"], ["Brand Kit", "/brand-kit"], ["Accounts", "/accounts"], ["Queue", "/queue"], ["Insights", "/insights"], ["Settings", "/settings"]] as const;

export function CommandPalette() {
  const router = useRouter();
  const open = useDemoStore((s) => s.paletteOpen);
  const setOpen = useDemoStore((s) => s.setPaletteOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const st = () => useDemoStore.getState();
    const go = (path: string, command?: string) => () => {
      router.push(path);
      if (command) st().setPendingCommand(command);
    };
    return [
      ...SCREENS.map(([label, path]): Command => ({ id: `go-${path}`, label: `Go to ${label}`, group: "Go to", run: go(path) })),
      { id: "generate", label: "Generate December", group: "Actions", run: go("/calendar", "generate") },
      { id: "send", label: "Send this week's previews", group: "Actions", run: go("/approvals", "send-previews") },
      {
        id: "publish", label: "Publish next approved post", group: "Actions",
        run: () => {
          const next = pickNextApproved(st().activeBusinessId);
          if (!next) return void toast.info("Nothing approved yet", { description: "Nothing publishes without approval." });
          router.push("/queue");
          enqueuePost(next.id);
        },
      },
      { id: "present", label: "Toggle presentation mode", group: "Actions", run: () => st().togglePresentation() },
      { id: "theme", label: "Switch light / dark theme", group: "Actions", run: () => st().setTheme(st().theme === "dark" ? "light" : "dark") },
      { id: "reset", label: "Reset demo", group: "Actions", run: () => { st().resetDemo(); toast.success("Demo reset"); } },
      ...getSeedBundles().map(({ business }): Command => ({ id: `sw-${business.id}`, label: `Switch to ${business.name}`, group: "Switch business", run: () => { st().setActiveBusiness(business.id); toast.success(`Switched to ${business.name}`); } })),
    ];
  }, [router]);

  const shown = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase().trim()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useDemoStore.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;
  const run = (c: Command | undefined) => {
    if (!c) return;
    setOpen(false);
    c.run();
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-start justify-items-center bg-black/60 px-4 pt-[14vh]" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()} className="glass w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); run(shown[active]); }
        }}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="size-4 text-fg-muted" aria-hidden />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant={shown[active] ? `cmd-${shown[active]!.id}` : undefined} aria-label="Type a command" placeholder="Type a command or search…" className="w-full bg-transparent text-sm outline-none placeholder:text-fg-muted" />
        </div>
        <ul id="palette-list" role="listbox" className="max-h-80 overflow-y-auto p-1.5">
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No matching command</li>}
          {shown.map((c, i) => (
            <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(c)} className={cn("flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm", i === active && "bg-panel-2")}>
              {c.label}<span className="text-[11px] text-fg-muted">{c.group}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
