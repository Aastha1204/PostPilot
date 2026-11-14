import { PublishError } from "@/lib/adapters/errors";
import { getPublisher, type PublishOutcome, type Quota } from "@/lib/adapters/publisher";
import { getStorage } from "@/lib/adapters/storage";
import type { Post } from "@/lib/types";
import { canPublish } from "./post-state";
import { renderPostSlides } from "./render";

export interface StepEntry {
  at: string;
  step: string;
}

export type PublishResult =
  | { kind: "blocked"; status: 409; message: string }
  | { kind: "deferred"; reason: string; quota: Quota; steps: StepEntry[] }
  | { kind: "ok"; outcome: PublishOutcome; quota: Quota; steps: StepEntry[] }
  | { kind: "error"; code: string; retryable: boolean; message: string; steps: StepEntry[] };

export function buildCaption(post: Post): string {
  const tags = post.hashtags.filter((h) => !post.caption.includes(h));
  return tags.length ? `${post.caption}\n\n${tags.join(" ")}` : post.caption;
}

/**
 * Publishes one post. The approval gate lives here, not in the UI: anything other than approved or
 * scheduled is refused with 409 before any network call is made.
 */
export async function publishPost(input: { post: Post; live: boolean; quotaUsed?: number; simulateFailure?: boolean }): Promise<PublishResult> {
  const { post, live } = input;
  if (!canPublish(post.status)) {
    return { kind: "blocked", status: 409, message: `Post is ${post.status.replace("_", " ")}. Only approved or scheduled posts can be published.` };
  }

  const steps: StepEntry[] = [];
  const log = (step: string) => steps.push({ at: new Date().toISOString(), step });
  const publisher = getPublisher(live);

  const quota = await publisher.getQuota({ used: input.quotaUsed });
  if (quota.used + 1 > quota.total) {
    return { kind: "deferred", reason: `Publishing limit reached (${quota.used} of ${quota.total} in the last 24 h). It will retry when the window frees up.`, quota, steps };
  }
  log(`Quota check passed (${quota.used} of ${quota.total} used)`);

  try {
    // Containers are created at publish time because unpublished ones expire after 24 hours.
    const count = post.templateId === "tip-carousel" ? (post.templateProps.slides?.length ?? 0) + 1 : 1;
    let imageUrls = Array.from({ length: count }, (_, i) => `https://storage.demo.postpilot.local/public/${post.businessId}/${post.id}-${i}.jpg`);
    if (publisher.name === "live" && post.format !== "reel") {
      const storage = getStorage(true);
      const files = await renderPostSlides(post);
      imageUrls = await Promise.all(files.map((buf, i) => storage.upload(`${post.businessId}/${post.id}-${i}.jpg`, buf, "image/jpeg")));
    }
    const outcome = await publisher.publish({ post, imageUrls, caption: buildCaption(post), simulateFailure: input.simulateFailure }, log);
    return { kind: "ok", outcome, quota: { ...quota, used: quota.used + 1 }, steps };
  } catch (err) {
    if (err instanceof PublishError) {
      if (err.code === "rate_limited") return { kind: "deferred", reason: err.message, quota, steps };
      return { kind: "error", code: err.code, retryable: err.retryable, message: err.message, steps };
    }
    return { kind: "error", code: "unknown", retryable: false, message: err instanceof Error ? err.message : "Unknown error", steps };
  }
}
