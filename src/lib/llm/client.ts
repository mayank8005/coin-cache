import { env } from "../env";
import type { ZodSchema } from "zod";

export class LlmOfflineError extends Error {
  constructor() {
    super("LLM offline");
    this.name = "LlmOfflineError";
  }
}

export interface LlmConfig {
  baseUrl: string | null;
  apiKey: string | null;
  model: string | null;
}

export const DEFAULT_SERVER_LLM_MODEL = "qwen3.5:4b";

interface ChatOptions<T> {
  system: string;
  user: string;
  schema?: ZodSchema<T>;
  temperature?: number;
  timeoutMs?: number;
  config?: LlmConfig;
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

const resolveConfig = (override?: LlmConfig): LlmConfig => {
  const e = env();
  return {
    baseUrl: override?.baseUrl ?? (e.LLM_BASE_URL || null),
    apiKey: override?.apiKey ?? (e.LLM_API_KEY || null),
    model: override?.model ?? (e.LLM_MODEL || null),
  };
};

export const isLlmConfigured = (override?: LlmConfig): boolean => {
  const cfg = resolveConfig(override);
  return typeof cfg.baseUrl === "string" && cfg.baseUrl.length > 0;
};

export const listModels = async (override?: LlmConfig): Promise<string[]> => {
  const cfg = resolveConfig(override);
  if (!cfg.baseUrl) return [];
  const e = env();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), e.LLM_HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      method: "GET",
      headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: Array<{ id?: string }> };
    if (!Array.isArray(body.data)) return [];
    return body.data
      .map((m) => (typeof m.id === "string" ? m.id : null))
      .filter((id): id is string => id !== null)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
};

const HEALTH_CACHE_TTL_MS = 30_000;
const healthCache = new Map<string, { ok: boolean; expiresAt: number }>();

export const llmHealth = async (override?: LlmConfig): Promise<boolean> => {
  const cfg = resolveConfig(override);
  if (!cfg.baseUrl) return false;
  const cacheKey = `${cfg.baseUrl}::${cfg.apiKey ?? ""}`;
  const now = Date.now();
  const hit = healthCache.get(cacheKey);
  if (hit && hit.expiresAt > now) return hit.ok;
  const e = env();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), e.LLM_HEALTH_TIMEOUT_MS);
  let ok = false;
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      method: "GET",
      headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
      signal: ctrl.signal,
    });
    ok = res.ok;
  } catch {
    ok = false;
  } finally {
    clearTimeout(t);
  }
  healthCache.set(cacheKey, { ok, expiresAt: now + HEALTH_CACHE_TTL_MS });
  return ok;
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
  const cfg = resolveConfig(opts.config);
  if (!cfg.baseUrl) throw new LlmOfflineError();
  const messages: Message[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20_000);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model || DEFAULT_SERVER_LLM_MODEL,
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

export const userLlmConfig = (u: {
  llmBaseUrl: string | null;
  llmApiKey: string | null;
  llmModel: string | null;
}): LlmConfig => ({ baseUrl: u.llmBaseUrl, apiKey: u.llmApiKey, model: u.llmModel });
