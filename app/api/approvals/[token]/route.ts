import { NextResponse } from "next/server";
import { getApprovalStore } from "@/lib/adapters/approval-store";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getApprovalStore().getSession(token);
  if (!session) return NextResponse.json({ error: "Link not found" }, { status: 404 });
  return NextResponse.json(session, { headers: { "cache-control": "no-store" } });
}
