"use client";

import { useEffect } from "react";
import { autopilotTick, tickJobs } from "@/lib/publishing/runner";

/** In-browser stand-in for the cron tick: runs due retries once a second, on every screen. */
export function PublishTicker() {
  useEffect(() => {
    const id = setInterval(() => {
      tickJobs();
      autopilotTick();
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
