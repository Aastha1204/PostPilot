import { NextResponse } from "next/server";
import { getApprovalStore } from "@/lib/adapters/approval-store";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const since = new URL(req.url).searchParams.get("since") ?? undefined;
  const events = await getApprovalStore().listEvents(token, since);
  return NextResponse.json({ events }, { headers: { "cache-control": "no-store" } });
}
