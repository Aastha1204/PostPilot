import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateToken } from "@/lib/gate";

export async function middleware(req: NextRequest) {
  const passcode = process.env.DEMO_PASSCODE;
  if (!passcode) return NextResponse.next();

  if (req.cookies.get(GATE_COOKIE)?.value === (await gateToken(passcode))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

// Token-scoped phone approval pages (/m/approve) and the landing page stay open.
export const config = {
  matcher: [
    "/calendar/:path*",
    "/approvals/:path*",
    "/autopilot/:path*",
    "/posts/:path*",
    "/templates/:path*",
    "/brand-kit/:path*",
    "/accounts/:path*",
    "/queue/:path*",
    "/insights/:path*",
    "/settings/:path*",
  ],
};
