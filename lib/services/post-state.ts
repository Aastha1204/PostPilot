import type { Post, PostStatus } from "@/lib/types";

/** The single source of truth for which status changes are allowed. */
const ALLOWED: Record<PostStatus, PostStatus[]> = {
  draft: ["awaiting_approval", "approved", "scheduled", "skipped"],
  awaiting_approval: ["approved", "scheduled", "draft", "skipped"],
  approved: ["scheduled", "publishing", "draft", "awaiting_approval", "skipped"],
  scheduled: ["publishing", "approved", "draft", "skipped"],
  publishing: ["published", "failed"],
  published: [],
  failed: ["publishing", "draft"],
  skipped: ["draft"],
};

export class InvalidTransitionError extends Error {
  constructor(readonly from: PostStatus, readonly to: PostStatus) {
    super(`Cannot move a post from ${from} to ${to}`);
  }
}

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** Publishing is only ever allowed for approved or scheduled posts; enforced here, not in the UI. */
export function canPublish(status: PostStatus): boolean {
  return status === "approved" || status === "scheduled";
}

export function transition(post: Post, to: PostStatus, note?: string, at = new Date().toISOString()): Post {
  if (!canTransition(post.status, to)) throw new InvalidTransitionError(post.status, to);
  return { ...post, status: to, updatedAt: at, timeline: [...post.timeline, { status: to, at, ...(note ? { note } : {}) }] };
}

/** Editing the content of an approved or scheduled post sends it back for approval. */
export function applyEdit(post: Post, patch: Partial<Post>, at = new Date().toISOString()): { post: Post; approvalReset: boolean } {
  const edited: Post = { ...post, ...patch, updatedAt: at };
  if (post.status === "approved" || post.status === "scheduled") {
    return { post: transition(edited, "draft", "Edited, needs approval again", at), approvalReset: true };
  }
  return { post: edited, approvalReset: false };
}
