import { NextResponse } from "next/server";
import { z } from "zod";
import { GATE_COOKIE, gateToken } from "@/lib/gate";

const bodySchema = z.object({ passcode: z.string().min(1) });

export async function POST(req: Request) {
  const expected = process.env.DEMO_PASSCODE;
  if (!expected) return NextResponse.json({ ok: true });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.passcode !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, await gateToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
