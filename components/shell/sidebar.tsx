"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Inbox,
  LayoutTemplate,
  Zap,
  ListChecks,
  Palette,
  Plug,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/autopilot", label: "Autopilot", icon: Zap },
  { href: "/approvals", label: "Approvals", icon: Send },
  { href: "/posts", label: "Posts", icon: Inbox },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/brand-kit", label: "Brand Kit", icon: Palette },
  { href: "/accounts", label: "Accounts", icon: Plug },
  { href: "/queue", label: "Queue", icon: ListChecks },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-0 bottom-0 z-40 flex justify-around px-1 py-1 md:static md:inset-auto md:z-auto md:w-60 md:shrink-0 md:flex-col md:justify-start md:gap-1 md:rounded-none md:border-y-0 md:border-l-0 md:p-4"
    >
      <Link href="/" className="mb-4 hidden items-center gap-2 px-2 py-1 md:flex">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent">
          <Send className="size-4 -rotate-12" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight">PostPilot</span>
      </Link>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm",
              active ? "bg-panel-2 font-medium text-fg" : "text-fg-muted hover:bg-panel-2 hover:text-fg",
            )}
          >
            <Icon className={cn("size-4", active && "text-accent")} aria-hidden />
            <span className="max-md:sr-only">{label}</span>
          </Link>
        );
      })}
      <p className="mt-auto hidden px-3 pt-6 text-[11px] text-fg-muted md:block">Built by Neovia AI</p>
    </nav>
  );
}
