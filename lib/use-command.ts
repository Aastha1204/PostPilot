"use client";

import { useEffect } from "react";
import { useDemoStore } from "./store";

/** Runs `handler` once when the command palette asks this screen for command `name`. */
export function useCommand(name: string, handler: () => void) {
  const pending = useDemoStore((s) => s.pendingCommand);
  useEffect(() => {
    if (pending !== name) return;
    useDemoStore.getState().setPendingCommand(null);
    handler();
  }, [pending, name, handler]);
}
