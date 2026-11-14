import type { Post } from "@/lib/types";
import { PublishError, mapGraphError } from "./errors";

export interface Quota {
  used: number;
  total: number;
  source: "live" | "demo" | "fallback";
}

export interface PublishInput {
  post: Post;
  /** Public URLs of the rendered JPEGs, one per slide. */
  imageUrls: string[];
  caption: string;
  simulateFailure?: boolean;
}

export interface PublishOutcome {
  igMediaId?: string;
  fbPostId?: string;
}

export type StepLogger = (step: string) => void;

export interface PublisherProvider {
  readonly name: "mock" | "live";
  getQuota(hint?: { used?: number }): Promise<Quota>;
  publish(input: PublishInput, log: StepLogger): Promise<PublishOutcome>;
}

const fallbackTotal = () => Number(process.env.IG_DAILY_LIMIT_FALLBACK) || 50;

/** Mirrors the live step sequence and response shapes so the queue UI is identical in demo mode. */
class MockPublisher implements PublisherProvider {
  readonly name = "mock" as const;
  async getQuota(hint?: { used?: number }): Promise<Quota> {
    return { used: hint?.used ?? 12, total: fallbackTotal(), source: "demo" };
  }
  async publish({ post, imageUrls, simulateFailure }: PublishInput, log: StepLogger): Promise<PublishOutcome> {
    log(`Uploaded ${imageUrls.length} file${imageUrls.length === 1 ? "" : "s"} to storage`);
    if (simulateFailure) throw new PublishError("network", "Simulated network timeout while creating the media container", true);
    const out: PublishOutcome = {};
    if (post.platforms.includes("instagram")) {
      const id = `${Date.now()}`.slice(-10);
      if (post.format === "carousel") log(`Created ${Math.max(imageUrls.length, 2)} carousel items`);
      log(`Created container ${id}`);
      log("Container status FINISHED");
      out.igMediaId = `178${id}`;
      log(`Published to Instagram (ig_media_id ${out.igMediaId})`);
    }
    if (post.platforms.includes("facebook")) {
      out.fbPostId = `1049${Date.now()}`.slice(0, 15);
      log(`Published to Facebook Page (post ${out.fbPostId})`);
    }
    for (const p of post.platforms) if (p === "linkedin" || p === "x") log(`Published to ${p === "x" ? "X" : "LinkedIn"} (preview)`);
    return out;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class LivePublisher implements PublisherProvider {
  readonly name = "live" as const;
  private readonly graph = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}`;
  private readonly igId = process.env.IG_USER_ID ?? "";
  private readonly token = process.env.IG_ACCESS_TOKEN ?? "";

  private async call(path: string, init: { method?: "GET" | "POST"; params?: Record<string, string>; token?: string }): Promise<Record<string, unknown>> {
    const params = new URLSearchParams({ ...(init.params ?? {}), access_token: init.token ?? this.token });
    const method = init.method ?? "GET";
    const url = method === "GET" ? `${this.graph}${path}?${params}` : `${this.graph}${path}`;
    let res: Response;
    try {
      res = await fetch(url, { method, body: method === "POST" ? params : undefined, signal: AbortSignal.timeout(20000) });
    } catch {
      throw new PublishError("network", "Could not reach the Graph API", true);
    }
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) throw mapGraphError(res.status, body);
    return body ?? {};
  }

  async getQuota(): Promise<Quota> {
    try {
      const r = (await this.call(`/${this.igId}/content_publishing_limit`, { params: { fields: "quota_usage,config" } })) as { data?: { quota_usage?: number; config?: { quota_total?: number } }[] };
      const row = r.data?.[0];
      if (typeof row?.quota_usage === "number") return { used: row.quota_usage, total: row.config?.quota_total ?? fallbackTotal(), source: "live" };
    } catch {
      /* fall through to the configurable fallback */
    }
    return { used: 0, total: fallbackTotal(), source: "fallback" };
  }

  private async waitFinished(containerId: string, log: StepLogger): Promise<void> {
    for (let i = 0; i < 15; i += 1) {
      const r = (await this.call(`/${containerId}`, { params: { fields: "status_code" } })) as { status_code?: string };
      if (r.status_code === "FINISHED") return log("Container status FINISHED");
      if (r.status_code === "ERROR" || r.status_code === "EXPIRED") throw new PublishError("unknown", `Container ${r.status_code}`, false);
      await sleep(2000);
    }
    throw new PublishError("media_not_ready", "Container was not ready in time", true);
  }

  async publish({ post, imageUrls, caption }: PublishInput, log: StepLogger): Promise<PublishOutcome> {
    if (post.format === "reel") throw new PublishError("unsupported", "Reels need a video file. Post the reel from the Instagram app using the cover and script.", false);
    log(`Uploaded ${imageUrls.length} file${imageUrls.length === 1 ? "" : "s"} to storage`);
    const out: PublishOutcome = {};
    if (post.platforms.includes("instagram")) {
      let creation: string;
      if (imageUrls.length > 1) {
        const children: string[] = [];
        for (const url of imageUrls) {
          const c = (await this.call(`/${this.igId}/media`, { method: "POST", params: { image_url: url, is_carousel_item: "true" } })) as { id: string };
          children.push(c.id);
        }
        log(`Created ${children.length} carousel items`);
        creation = ((await this.call(`/${this.igId}/media`, { method: "POST", params: { media_type: "CAROUSEL", children: children.join(","), caption } })) as { id: string }).id;
      } else {
        creation = ((await this.call(`/${this.igId}/media`, { method: "POST", params: { image_url: imageUrls[0] ?? "", caption } })) as { id: string }).id;
      }
      log(`Created container ${creation}`);
      await this.waitFinished(creation, log);
      const pub = (await this.call(`/${this.igId}/media_publish`, { method: "POST", params: { creation_id: creation } })) as { id: string };
      out.igMediaId = pub.id;
      log(`Published to Instagram (ig_media_id ${pub.id})`);
    }
    if (post.platforms.includes("facebook") && process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN) {
      const fb = (await this.call(`/${process.env.FB_PAGE_ID}/photos`, { method: "POST", token: process.env.FB_PAGE_ACCESS_TOKEN, params: { url: imageUrls[0] ?? "", message: caption } })) as { post_id?: string; id?: string };
      out.fbPostId = fb.post_id ?? fb.id;
      log(`Published to Facebook Page (post ${out.fbPostId})`);
    }
    for (const p of post.platforms) if (p === "linkedin" || p === "x") log(`Skipped ${p === "x" ? "X" : "LinkedIn"}: no live connector yet, post it manually`);
    return out;
  }
}

export function igConfigured(): boolean {
  return Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
}

export function getPublisher(live: boolean): PublisherProvider {
  return live && igConfigured() ? new LivePublisher() : new MockPublisher();
}
