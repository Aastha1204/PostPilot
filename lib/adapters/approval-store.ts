import { hasSupabase } from "@/lib/config";
import { eventSchema, sessionSchema, type ApprovalEvent, type ApprovalSession } from "@/lib/approvals/types";

export interface ApprovalStore {
  createSession(session: ApprovalSession): Promise<void>;
  getSession(token: string): Promise<ApprovalSession | null>;
  saveSession(session: ApprovalSession): Promise<void>;
  addEvent(event: ApprovalEvent): Promise<void>;
  listEvents(token: string, since?: string): Promise<ApprovalEvent[]>;
}

type Memory = { sessions: Map<string, ApprovalSession>; events: Map<string, ApprovalEvent[]> };
const g = globalThis as typeof globalThis & { __ppApprovals?: Memory };

/** In-process store: fine for a local demo where the phone talks to the same server as the laptop. */
class MemoryApprovalStore implements ApprovalStore {
  private get mem(): Memory {
    return (g.__ppApprovals ??= { sessions: new Map(), events: new Map() });
  }
  async createSession(s: ApprovalSession) { this.mem.sessions.set(s.token, s); }
  async getSession(token: string) { return this.mem.sessions.get(token) ?? null; }
  async saveSession(s: ApprovalSession) { this.mem.sessions.set(s.token, s); }
  async addEvent(e: ApprovalEvent) { this.mem.events.set(e.token, [...(this.mem.events.get(e.token) ?? []), e]); }
  async listEvents(token: string, since?: string) {
    return (this.mem.events.get(token) ?? []).filter((e) => !since || e.at > since);
  }
}

/** Supabase over PostgREST with the service role key; used by the server only. */
class SupabaseApprovalStore implements ApprovalStore {
  private readonly base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
  private readonly headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "content-type": "application/json",
  };

  private async call(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`${this.base}${path}`, { ...init, headers: { ...this.headers, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  async createSession(s: ApprovalSession) {
    await this.call("/approval_session", { method: "POST", body: JSON.stringify({ token: s.token, business_id: s.businessId, week_start: s.weekStart, posts: s.posts, created_at: s.createdAt }) });
  }
  async getSession(token: string) {
    const rows = (await this.call(`/approval_session?token=eq.${encodeURIComponent(token)}&limit=1`)) as { token: string; business_id: string; week_start: string; posts: unknown; created_at: string }[];
    const r = rows[0];
    return r ? sessionSchema.parse({ token: r.token, businessId: r.business_id, weekStart: r.week_start, posts: r.posts, createdAt: r.created_at }) : null;
  }
  async saveSession(s: ApprovalSession) {
    await this.call(`/approval_session?token=eq.${encodeURIComponent(s.token)}`, { method: "PATCH", body: JSON.stringify({ posts: s.posts }) });
  }
  async addEvent(e: ApprovalEvent) {
    await this.call("/approval_event", { method: "POST", body: JSON.stringify({ id: e.id, token: e.token, post_id: e.postId, action: e.action, comment: e.comment, revised: e.revised, summary: e.summary, channel: e.channel, at: e.at }) });
  }
  async listEvents(token: string, since?: string) {
    const filter = since ? `&at=gt.${encodeURIComponent(since)}` : "";
    const rows = (await this.call(`/approval_event?token=eq.${encodeURIComponent(token)}${filter}&order=at.asc`)) as { id: string; token: string; post_id: string; action: string; comment: string | null; revised: unknown; summary: string | null; channel: string; at: string }[];
    return rows.map((r) => eventSchema.parse({ id: r.id, token: r.token, postId: r.post_id, action: r.action, comment: r.comment ?? undefined, revised: r.revised ?? undefined, summary: r.summary ?? undefined, channel: r.channel, at: r.at }));
  }
}

export function getApprovalStore(): ApprovalStore {
  return hasSupabase() ? new SupabaseApprovalStore() : new MemoryApprovalStore();
}
