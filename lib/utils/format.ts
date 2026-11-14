const TZ = "Asia/Kolkata";

/** "21 Nov" in IST. Accepts a Date or an ISO string. */
export function formatDayMonth(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input.length === 10 ? `${input}T00:00:00+05:30` : input) : input;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short" }).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${day} ${month}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** "14 Nov, 9:00 am" in IST from any ISO timestamp. */
export function formatIstStamp(iso: string): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return `${formatDayMonth(d)}, ${time.toLowerCase()}`;
}

/** "09:41" (24 h) in IST. */
export function formatIstTime24(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}
