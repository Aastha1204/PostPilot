export type PublishErrorCode = "rate_limited" | "network" | "media_not_ready" | "invalid_token" | "permission" | "unsupported" | "unknown";

/** Typed failure: retryable errors back off and retry; permanent ones fail the post and notify. */
export class PublishError extends Error {
  constructor(readonly code: PublishErrorCode, message: string, readonly retryable: boolean) {
    super(message);
  }
}

/** Maps a Meta Graph API error body to a typed error. */
export function mapGraphError(status: number, body: unknown): PublishError {
  const err = (body as { error?: { code?: number; message?: string } } | null)?.error;
  const code = err?.code;
  const message = err?.message ?? `Graph API returned ${status}`;
  if (code === 190 || status === 401) return new PublishError("invalid_token", `Access token is invalid or expired. ${message}`, false);
  if (code === 4 || code === 17 || code === 32 || code === 613) return new PublishError("rate_limited", message, true);
  if (code === 10 || code === 200 || code === 283) return new PublishError("permission", message, false);
  if (code === 9007 || code === 2207027) return new PublishError("media_not_ready", message, true);
  if (code === 1 || code === 2 || status >= 500) return new PublishError("network", message, true);
  return new PublishError("unknown", message, false);
}
