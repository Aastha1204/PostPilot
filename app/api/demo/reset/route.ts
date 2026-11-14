import { NextResponse } from "next/server";

// Demo state lives in the browser store; this endpoint is the hook for server-side state once Supabase is wired in.
export function POST() {
  return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
}
