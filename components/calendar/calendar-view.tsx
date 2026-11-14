"use client";

import { useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CalendarDays, ChevronLeft, ChevronRight, List, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { useActiveBundle } from "@/components/providers";
import { DEFAULT_MONTH, DEMO_TODAY } from "@/lib/demo-clock";
import { festivalsFor } from "@/lib/festivals";
import { seedScript } from "@/lib/seed-posts";
import { useDemoStore } from "@/lib/store";
import { tokensFor } from "@/lib/templates/tokens";
import { useGeneration } from "@/lib/use-generation";
import { useCommand } from "@/lib/use-command";
import { cn } from "@/lib/utils/cn";
import { addDays, addMonths, formatTime, monthGrid, monthLabel, monthName, postDate, startOfWeek, weekdayShort, withDate } from "@/lib/utils/dates";
import { formatDayMonth } from "@/lib/utils/format";
import type { PostFormat, PostStatus } from "@/lib/types";
import { DayCell } from "./day-cell";
import { GenerateButton } from "./generate-button";
import { PlanningPanel } from "./planning-panel";
import { PostSheet } from "./post-sheet";
import { PostThumb } from "./post-thumb";
import { FORMAT_META, STATUS_META, StatusChip } from "./status";
import { StatsRail } from "./stats-rail";

type View = "month" | "week" | "list";

const selectClass = "rounded-full border border-line bg-panel px-3 py-1.5 text-xs";

export function CalendarView() {
  const bundle = useActiveBundle();
  const { business, pillars } = bundle;
  const tokens = useMemo(() => tokensFor(bundle), [bundle]);
  const posts = useDemoStore((s) => s.posts);
  const updatePost = useDemoStore((s) => s.updatePost);
  const mode = useDemoStore((s) => s.mode);
  const gen = useGeneration();

  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(`${DEFAULT_MONTH}-01`);
  const [pillarFilter, setPillarFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState<"all" | PostFormat>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const month = anchor.slice(0, 7);
  const festivals = useMemo(() => festivalsFor(business.type), [business.type]);

  const businessPosts = useMemo(() => Object.values(posts).filter((p) => p.businessId === business.id), [posts, business.id]);
  const monthPosts = businessPosts.filter((p) => postDate(p.scheduledAt).startsWith(month));
  const visible = businessPosts.filter(
    (p) => (pillarFilter === "all" || p.pillarId === pillarFilter) && (formatFilter === "all" || p.format === formatFilter) && (statusFilter === "all" || p.status === statusFilter),
  );
  const byDate = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const p of visible) map.set(postDate(p.scheduledAt), [...(map.get(postDate(p.scheduledAt)) ?? []), p]);
    for (const list of map.values()) list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    return map;
  }, [visible]);

  const hasSeed = seedScript(business.id, month).length > 0;
  const canGenerate = monthPosts.length === 0 && (hasSeed || mode === "live");
  const reason = monthPosts.length > 0 ? "This month is already planned. Use Reset demo to run it again." : "Demo data covers December 2026. Switch to Live mode for other months.";

  useCommand("generate", () => {
    if (canGenerate) void gen.start(business.id, month);
    else toast.info("Nothing to generate", { description: reason });
  });

  function shift(dir: 1 | -1) {
    setAnchor((a) => (view === "week" ? addDays(a, 7 * dir) : `${addMonths(a.slice(0, 7), dir)}-01`));
  }

  function onDragEnd(e: DragEndEvent) {
    const date = e.over?.id;
    const post = posts[String(e.active.id)];
    if (!post || typeof date !== "string" || date === postDate(post.scheduledAt)) return;
    if (date < DEMO_TODAY) {
      toast.error("Pick a day that hasn't passed yet");
      return;
    }
    const previous = post.scheduledAt;
    updatePost(post.id, { scheduledAt: withDate(previous, date) });
    toast.success(`Moved to ${formatDayMonth(date)}`, {
      description: `${post.title} keeps its ${formatTime(previous)} slot.`,
      action: { label: "Undo", onClick: () => updatePost(post.id, { scheduledAt: previous }) },
    });
  }

  const cell = (date: string, tall = false) => (
    <DayCell
      key={date}
      date={date}
      inMonth={date.startsWith(month)}
      isToday={date === DEMO_TODAY}
      posts={byDate.get(date) ?? []}
      festival={festivals.find((f) => f.date === date)}
      tokens={tokens}
      pillars={pillars}
      arrived={gen.arrived}
      tall={tall}
      onOpen={setOpenId}
    />
  );

  const weekStart = startOfWeek(anchor);
  const heading = view === "week" ? `${formatDayMonth(weekStart)} – ${formatDayMonth(addDays(weekStart, 6))}` : monthLabel(month);
  const openPost = openId ? posts[openId] : undefined;
  const sorted = [...visible].filter((p) => postDate(p.scheduledAt).startsWith(month)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-full border border-line bg-panel"><ChevronLeft className="size-4" aria-hidden /></button>
          <h1 className="min-w-44 text-center font-serif text-2xl font-semibold">{heading}</h1>
          <button type="button" aria-label="Next" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-full border border-line bg-panel"><ChevronRight className="size-4" aria-hidden /></button>
        </div>
        <div role="group" aria-label="View" className="flex rounded-full border border-line bg-panel p-0.5 text-xs">
          {([["month", "Month", CalendarDays], ["week", "Week", Rows3], ["list", "List", List]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5", view === id ? "bg-accent text-on-accent" : "text-fg-muted hover:text-fg")}>
              <Icon className="size-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <select aria-label="Filter by pillar" value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className={selectClass}>
          <option value="all">All pillars</option>
          {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Filter by format" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as typeof formatFilter)} className={selectClass}>
          <option value="all">All formats</option>
          {Object.entries(FORMAT_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={selectClass}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
        </select>
        <div className="ml-auto">
          <GenerateButton
            label={`Generate ${monthName(month)}`}
            running={gen.running}
            count={gen.progress.count}
            total={gen.progress.total}
            disabled={!canGenerate}
            reason={reason}
            onClick={() => gen.start(business.id, month)}
          />
        </div>
      </div>

      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-muted" aria-label="Status legend">
        {Object.values(STATUS_META).map((m) => <li key={m.label} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: m.colour }} aria-hidden />{m.label}</li>)}
      </ul>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {(gen.running || gen.summary) && <PlanningPanel steps={gen.steps} running={gen.running} summary={gen.summary} onDismiss={gen.dismiss} />}

          {view !== "list" ? (
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <div role="grid" aria-label={heading} className="relative overflow-hidden rounded-card border-l border-t border-line bg-panel">
                <div role="row" className="grid grid-cols-7 border-b border-r border-line bg-panel-2 text-center text-[11px] font-medium text-fg-muted">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} role="columnheader" className="py-2">{d}</div>)}
                </div>
                {view === "month"
                  ? monthGrid(month).map((week) => <div key={week[0]} role="row" className="grid grid-cols-7">{week.map((d) => cell(d))}</div>)
                  : <div role="row" className="grid grid-cols-7">{Array.from({ length: 7 }, (_, i) => cell(addDays(weekStart, i), true))}</div>}
                {monthPosts.length === 0 && !gen.running && (
                  <div className="absolute inset-x-0 top-24 mx-auto w-fit max-w-sm rounded-2xl border border-line bg-panel/95 px-6 py-5 text-center shadow-xl">
                    <p className="font-serif text-xl font-semibold">Nothing planned for {monthName(month)} yet</p>
                    <p className="mt-1 text-sm text-fg-muted">{canGenerate ? `Press Generate ${monthName(month)} and the month fills in about a minute.` : reason}</p>
                  </div>
                )}
              </div>
            </DndContext>
          ) : (
            <div className="overflow-x-auto rounded-card border border-line bg-panel">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-fg-muted"><tr><th className="p-3">Date</th><th>Post</th><th>Pillar</th><th>Format</th><th>Status</th></tr></thead>
                <tbody>
                  {sorted.map((p) => {
                    const pillar = pillars.find((x) => x.id === p.pillarId);
                    return (
                      <tr key={p.id} className="border-b border-line last:border-0">
                        <td className="whitespace-nowrap p-3">{weekdayShort(postDate(p.scheduledAt))}, {formatDayMonth(postDate(p.scheduledAt))}<span className="block text-xs text-fg-muted">{formatTime(p.scheduledAt)}</span></td>
                        <td>
                          <button type="button" onClick={() => setOpenId(p.id)} className="flex items-center gap-3 py-2 text-left hover:text-accent">
                            <span className="w-9 shrink-0"><PostThumb post={p} tokens={tokens} /></span>{p.title}
                          </button>
                        </td>
                        <td><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: pillar?.colour }} aria-hidden />{pillar?.name}</span></td>
                        <td>{FORMAT_META[p.format].label}</td>
                        <td><StatusChip status={p.status} /></td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-fg-muted">No posts match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <StatsRail posts={monthPosts} pillars={pillars} />
      </div>

      {openPost && <PostSheet post={openPost} tokens={tokens} pillar={pillars.find((p) => p.id === openPost.pillarId)} onClose={() => setOpenId(null)} />}
    </>
  );
}
