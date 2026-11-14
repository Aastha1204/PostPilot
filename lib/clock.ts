/** Demo time starts at 9:00 am IST on the demo day and can be skipped forward to show autopilot posting on time. */
const BASE = Date.parse("2026-11-14T09:00:00+05:30");
const STARTED = Date.now();

export function appNow(mode: "demo" | "live", offsetMs: number): number {
  return mode === "live" ? Date.now() : BASE + offsetMs + (Date.now() - STARTED);
}

/** Offset that makes demo time equal `targetMs` right now. */
export function offsetFor(targetMs: number): number {
  return targetMs - BASE - (Date.now() - STARTED);
}
