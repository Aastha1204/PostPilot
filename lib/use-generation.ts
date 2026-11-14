"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useDemoStore } from "@/lib/store";
import type { GenEvent, GenerationSummary, StepId } from "@/lib/services/calendar-generator";

export type StepState = "pending" | "active" | "done";

export const STEPS: { id: StepId; label: string }[] = [
  { id: "reading", label: "Reading brand kit" },
  { id: "mapping", label: "Mapping festivals" },
  { id: "balancing", label: "Balancing pillars" },
  { id: "writing", label: "Writing captions" },
  { id: "designing", label: "Designing posts" },
];

const idleSteps = (): Record<StepId, StepState> => ({ reading: "pending", mapping: "pending", balancing: "pending", writing: "pending", designing: "pending" });

export function useGeneration() {
  const addPost = useDemoStore((s) => s.addPost);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(idleSteps);
  const [progress, setProgress] = useState({ count: 0, total: 0 });
  const [summary, setSummary] = useState<GenerationSummary | null>(null);
  const [arrived, setArrived] = useState<ReadonlySet<string>>(new Set());
  const busy = useRef(false);

  const dismiss = useCallback(() => setSummary(null), []);

  const start = useCallback(
    async (businessId: string, month: string) => {
      if (busy.current) return;
      busy.current = true;
      const { mode, settings, posts } = useDemoStore.getState();
      setRunning(true);
      setSummary(null);
      setSteps(idleSteps());
      setProgress({ count: 0, total: 0 });
      setArrived(new Set());
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 75_000);
      try {
        const res = await fetch("/api/generate/calendar", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            businessId,
            month,
            mode,
            speed: settings.generationSpeed,
            existingTitles: Object.values(posts).filter((p) => p.businessId === businessId).map((p) => p.title),
          }),
        });
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const handle = (event: GenEvent) => {
          if (event.type === "step") setSteps((s) => ({ ...s, [event.id]: event.status }));
          else if (event.type === "post") {
            addPost(event.post);
            setArrived((a) => new Set(a).add(event.post.id));
            setProgress({ count: event.index, total: event.total });
          } else if (event.type === "notice") toast.info(event.message);
          else setSummary(event.summary);
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) if (line.trim()) handle(JSON.parse(line) as GenEvent);
        }
        toast.success("Calendar ready", { description: "Review each post, then send the week's previews for approval." });
      } catch {
        toast.error("Generation was interrupted", { description: "Posts planned so far are kept. Try again to continue." });
      } finally {
        clearTimeout(timer);
        busy.current = false;
        setRunning(false);
      }
    },
    [addPost],
  );

  return { running, steps, progress, summary, arrived, start, dismiss };
}
