/** Server-only: which live integrations have credentials. Never expose the values. */
export interface RuntimeConfig {
  liveAvailable: boolean;
  missing: string[];
  /** Phone approval links need somewhere shared to keep state: Supabase, or the local in-memory option. */
  approvalSync: boolean;
  /** OpenAI key present: captions and images can be generated for real. */
  openai: boolean;
}

export function getRuntimeConfig(): RuntimeConfig {
  const provider = process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "groq");
  const llmKey = provider === "openai" ? "OPENAI_API_KEY" : provider === "gemini" ? "GEMINI_API_KEY" : "GROQ_API_KEY";
  const required = provider === "openai" ? [llmKey, "IG_USER_ID", "IG_ACCESS_TOKEN"] : [llmKey, "LLM_MODEL", "IG_USER_ID", "IG_ACCESS_TOKEN"];
  const missing = required.filter((k) => !process.env[k]);
  const approvalSync = hasSupabase() || process.env.APPROVAL_LOCAL_SYNC === "true";
  return { liveAvailable: missing.length === 0, missing, approvalSync, openai: Boolean(process.env.OPENAI_API_KEY) };
}

export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
