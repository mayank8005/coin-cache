import { env } from "../env";
import type { ZodSchema } from "zod";

export class LlmOfflineError extends Error {
  constructor() {
    super("LLM offline");
    this.name = "LlmOfflineError";
  }
}

interface ChatOptions<T> {
  system: string;
  user: string;
  schema?: ZodSchema<T>;
  temperature?: number;
  timeoutMs?: number;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatChoice {
  message: { role: string; content: string };
}

interface ChatResponse {
  choices: ChatChoice[];
}

export const isLlmConfigured = (): boolean => {
  const base = env().LLM_BASE_URL;
  return typeof base === "string" && base.length > 0;
};

export const llmHealth = async (): Promise<boolean> => {
  if (!isLlmConfigured()) return false;
  const e = env();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), e.LLM_HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${e.LLM_BASE_URL}/models`, {
      method: "GET",
      headers: e.LLM_API_KEY ? { Authorization: `Bearer ${e.LLM_API_KEY}` } : {},
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
};

const tryParseJson = (raw: string): unknown => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

export async function chat<T>(opts: ChatOptions<T>): Promise<T extends unknown ? T : string> {
  if (!isLlmConfigured()) throw new LlmOfflineError();
  const e = env();
  const messages: Message[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20_000);
  try {
    const res = await fetch(`${e.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(e.LLM_API_KEY ? { Authorization: `Bearer ${e.LLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: e.LLM_MODEL || "llama3.1:8b",
        messages,
        temperature: opts.temperature ?? 0.2,
        ...(opts.schema ? { response_format: { type: "json_object" as const } } : {}),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new LlmOfflineError();
    const body = (await res.json()) as ChatResponse;
    const content = body.choices?.[0]?.message?.content ?? "";
    if (!opts.schema) return content as T extends unknown ? T : string;
    const parsed = tryParseJson(content);
    const result = opts.schema.safeParse(parsed);
    if (!result.success) throw new Error("LLM returned unparseable response");
    return result.data as T extends unknown ? T : string;
  } catch (err) {
    if (err instanceof LlmOfflineError) throw err;
    throw new LlmOfflineError();
  } finally {
    clearTimeout(t);
  }
}
