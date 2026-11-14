export const GATE_COOKIE = "pp_gate";

/** SHA-256 hex of the passcode, via Web Crypto so it works in middleware and route handlers. */
export async function gateToken(passcode: string): Promise<string> {
  const bytes = new TextEncoder().encode(`postpilot:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
