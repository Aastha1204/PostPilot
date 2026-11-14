// Dates are plain "YYYY-MM-DD" strings in IST; all maths goes through UTC to avoid local-timezone drift.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toUtc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return fromUtc(d).slice(0, 7);
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(date: string): number {
  return (toUtc(date).getUTCDay() + 6) % 7;
}

export function startOfWeek(date: string): string {
  return addDays(date, -weekdayIndex(date));
}

export function monthName(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1] ?? "";
}

export function monthLabel(month: string): string {
  return `${monthName(month)} ${month.slice(0, 4)}`;
}

/** Weeks (Mon–Sun) covering the month. */
export function monthGrid(month: string): string[][] {
  const first = `${month}-01`;
  let cursor = startOfWeek(first);
  const weeks: string[][] = [];
  do {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  } while (cursor.slice(0, 7) <= month);
  return weeks;
}

export function postDate(scheduledAt: string): string {
  return scheduledAt.slice(0, 10);
}

export function postTime(scheduledAt: string): string {
  return scheduledAt.slice(11, 16);
}

export function withDate(scheduledAt: string, date: string): string {
  return `${date}${scheduledAt.slice(10)}`;
}

export function formatTime(scheduledAt: string): string {
  const [h, m] = postTime(scheduledAt).split(":").map(Number) as [number, number];
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}

export function weekdayShort(date: string): string {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][weekdayIndex(date)] ?? "";
}
