import { hasSupabase } from "@/lib/config";
import { postSchema } from "@/lib/schemas";
import type { Post } from "@/lib/types";

export interface PostRepository {
  upsert(post: Post): Promise<void>;
  listDue(nowIso: string): Promise<Post[]>;
  patch(id: string, patch: Partial<Post>): Promise<void>;
}

type Row = Record<string, unknown>;

const toRow = (p: Post): Row => ({
  id: p.id, business_id: p.businessId, pillar_id: p.pillarId, format: p.format, title: p.title, caption: p.caption,
  hashtags: p.hashtags, cta: p.cta, visual_brief: p.visualBrief, template_id: p.templateId, template_props: p.templateProps,
  scheduled_at: p.scheduledAt, status: p.status, platforms: p.platforms, ig_media_id: p.igMediaId ?? null, fact_flags: p.factFlags,
  updated_at: p.updatedAt,
  meta: { photoTags: p.photoTags, variant: p.variant, watermark: p.watermark, factConfirmed: p.factConfirmed, timeline: p.timeline, festivalId: p.festivalId, createdAt: p.createdAt, attempts: 0 },
});

const fromRow = (r: Row): Post => {
  const meta = (r.meta ?? {}) as Record<string, unknown>;
  return postSchema.parse({
    id: r.id, businessId: r.business_id, pillarId: r.pillar_id ?? "", format: r.format, title: r.title, caption: r.caption,
    hashtags: r.hashtags ?? [], cta: r.cta ?? "", visualBrief: r.visual_brief ?? "", templateId: r.template_id, templateProps: r.template_props,
    photoTags: meta.photoTags ?? [], scheduledAt: r.scheduled_at, status: r.status, platforms: r.platforms ?? ["instagram"],
    factFlags: r.fact_flags ?? [], igMediaId: r.ig_media_id ?? undefined, variant: meta.variant ?? 0, watermark: meta.watermark ?? true,
    factConfirmed: meta.factConfirmed ?? [], timeline: meta.timeline ?? [], festivalId: meta.festivalId,
    createdAt: meta.createdAt ?? r.updated_at ?? new Date().toISOString(), updatedAt: r.updated_at ?? new Date().toISOString(),
  });
};

class SupabasePostRepo implements PostRepository {
  private readonly base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
  private readonly headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`, "content-type": "application/json" };

  private async call(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`${this.base}${path}`, { ...init, headers: { ...this.headers, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  async upsert(post: Post) {
    await this.call("/business", { method: "POST", headers: { prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ id: post.businessId, name: post.businessId, type: "wedding_planner" }) });
    await this.call("/post", { method: "POST", headers: { prefer: "resolution=merge-duplicates" }, body: JSON.stringify(toRow(post)) });
  }
  async listDue(nowIso: string) {
    const rows = (await this.call(`/post?status=in.(approved,scheduled)&scheduled_at=lte.${encodeURIComponent(nowIso)}&order=scheduled_at.asc&limit=10`)) as Row[];
    return rows.map(fromRow);
  }
  async patch(id: string, patch: Partial<Post>) {
    const row: Row = {};
    if (patch.status) row.status = patch.status;
    if (patch.igMediaId) row.ig_media_id = patch.igMediaId;
    row.updated_at = new Date().toISOString();
    await this.call(`/post?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(row) });
  }
}

export function getPostRepo(): PostRepository | null {
  return hasSupabase() ? new SupabasePostRepo() : null;
}
