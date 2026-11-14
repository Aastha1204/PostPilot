export interface LLMProvider {
  readonly name: string;
  /** Returns the raw JSON string the model produced. Rejects on timeout or HTTP error. */
  completeJson(system: string, user: string, timeoutMs: number): Promise<string>;
}

async function postJson(url: string, init: { headers: Record<string, string>; body: unknown }, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...init.headers },
    body: JSON.stringify(init.body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  return res.json();
}

export class GroqProvider implements LLMProvider {
  readonly name = "groq";
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async completeJson(system: string, user: string, timeoutMs: number): Promise<string> {
    const data = (await postJson(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        headers: { authorization: `Bearer ${this.apiKey}` },
        body: {
          model: this.model,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        },
      },
      timeoutMs,
    )) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty LLM response");
    return text;
  }
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async completeJson(system: string, user: string, timeoutMs: number): Promise<string> {
    const data = (await postJson(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: { authorization: `Bearer ${this.apiKey}` },
        body: { model: this.model, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] },
      },
      timeoutMs,
    )) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty LLM response");
    return text;
  }
}

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async completeJson(system: string, user: string, timeoutMs: number): Promise<string> {
    const data = (await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        headers: { "x-goog-api-key": this.apiKey },
        body: {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json" },
        },
      },
      timeoutMs,
    )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty LLM response");
    return text;
  }
}

/** Provider from env, or null when credentials are missing (callers fall back to seed data). */
export function getLLM(): LLMProvider | null {
  const provider = process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "groq");
  if (provider === "openai") {
    return process.env.OPENAI_API_KEY ? new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.LLM_MODEL || "gpt-4o-mini") : null;
  }
  const model = process.env.LLM_MODEL;
  if (!model) return null;
  if (provider === "gemini") return process.env.GEMINI_API_KEY ? new GeminiProvider(process.env.GEMINI_API_KEY, model) : null;
  return process.env.GROQ_API_KEY ? new GroqProvider(process.env.GROQ_API_KEY, model) : null;
}
