"use client";

import { z, type ZodSchema } from "zod";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";
import { financeChatSystem, insightsSystem, nlParseSystem } from "@/lib/llm/prompts";
import { ParsedTransactionSchema } from "@/utils/validation";
import type { CurrencyCode } from "@/types/design";
import { formatAmount } from "@/utils/format";

export const DEFAULT_BROWSER_LLM_BASE_URL = "http://192.168.0.95:11434";
export const DEFAULT_BROWSER_LLM_MODEL = "gemma4:e2b";

export interface BrowserLlmSettings {
  llmBaseUrl: string | null;
  llmApiKey: string | null;
  llmModel: string | null;
}

interface BrowserLlmConfig {
  baseUrl: string;
  apiKey: string | null;
  model: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface ChatStreamChoice {
  delta?: {
    content?: string | null;
    reasoning?: string | null;
    reasoning_content?: string | null;
    thinking?: string | null;
  };
  message?: {
    content?: string | null;
    reasoning?: string | null;
    reasoning_content?: string | null;
    thinking?: string | null;
  };
}

interface ChatStreamChunk {
  choices?: ChatStreamChoice[];
  message?: {
    content?: string | null;
    thinking?: string | null;
  };
}

export class BrowserLlmOfflineError extends Error {
  constructor() {
    super("LLM offline");
    this.name = "BrowserLlmOfflineError";
  }
}

export const normalizeBrowserLlmBaseUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  const url = new URL(trimmed);
  const pathname = url.pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/v1") || pathname === "/v1") return url.toString().replace(/\/+$/, "");
  if (pathname === "") {
    url.pathname = "/v1";
    return url.toString().replace(/\/+$/, "");
  }
  return url.toString().replace(/\/+$/, "");
};

export const browserLlmConfig = (settings: BrowserLlmSettings): BrowserLlmConfig => ({
  baseUrl: normalizeBrowserLlmBaseUrl(settings.llmBaseUrl || DEFAULT_BROWSER_LLM_BASE_URL),
  apiKey: settings.llmApiKey?.trim() || null,
  model: settings.llmModel?.trim() || DEFAULT_BROWSER_LLM_MODEL,
});

const authHeaders = (cfg: BrowserLlmConfig): HeadersInit =>
  cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};

export const listBrowserLlmModels = async (settings: BrowserLlmSettings): Promise<string[]> => {
  const cfg = browserLlmConfig(settings);
  const res = await fetch(`${cfg.baseUrl}/models`, { headers: authHeaders(cfg) });
  if (!res.ok) throw new BrowserLlmOfflineError();
  const body = (await res.json()) as { data?: Array<{ id?: string }> };
  return (body.data ?? [])
    .map((m) => (typeof m.id === "string" ? m.id : null))
    .filter((id): id is string => id !== null)
    .sort((a, b) => a.localeCompare(b));
};

export const browserLlmHealth = async (settings: BrowserLlmSettings): Promise<boolean> => {
  try {
    await listBrowserLlmModels(settings);
    return true;
  } catch {
    return false;
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

const chatJson = async <T>(
  settings: BrowserLlmSettings,
  opts: {
    system: string;
    user: string;
    schema: ZodSchema<T>;
    temperature?: number;
    timeoutMs?: number;
  },
): Promise<T> => {
  const cfg = browserLlmConfig(settings);
  const messages: Message[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  const ctrl = new AbortController();
  const timeout = window.setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 25_000);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(cfg),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.2,
        response_format: { type: "json_object" },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new BrowserLlmOfflineError();
    const body = (await res.json()) as ChatResponse;
    const parsed = tryParseJson(body.choices?.[0]?.message?.content ?? "");
    const result = opts.schema.safeParse(parsed);
    if (!result.success) throw new Error("LLM returned unparseable response");
    return result.data;
  } catch (err) {
    if (err instanceof BrowserLlmOfflineError) throw err;
    throw new BrowserLlmOfflineError();
  } finally {
    window.clearTimeout(timeout);
  }
};

const streamChatJson = async <T>(
  settings: BrowserLlmSettings,
  opts: {
    system: string;
    user: string;
    schema: ZodSchema<T>;
    temperature?: number;
    timeoutMs?: number;
    onThinkingDelta?: (delta: string) => void;
    onContentDelta?: (delta: string) => void;
  },
): Promise<T> => {
  const cfg = browserLlmConfig(settings);
  const messages: Message[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  const ctrl = new AbortController();
  const timeout = window.setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 60_000);
  let content = "";
  let thinking = "";

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(cfg),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.2,
        response_format: { type: "json_object" },
        stream: true,
        reasoning_effort: "medium",
        reasoning: { effort: "medium" },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new BrowserLlmOfflineError();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;
        const data = line.startsWith("data:") ? line.slice(5).trim() : line;
        if (!data || data === "[DONE]") continue;

        let chunk: ChatStreamChunk;
        try {
          chunk = JSON.parse(data) as ChatStreamChunk;
        } catch {
          continue;
        }

        const choice = chunk.choices?.[0];
        const thinkingDelta =
          choice?.delta?.reasoning_content ??
          choice?.delta?.reasoning ??
          choice?.delta?.thinking ??
          choice?.message?.reasoning_content ??
          choice?.message?.reasoning ??
          choice?.message?.thinking ??
          chunk.message?.thinking ??
          "";
        const contentDelta =
          choice?.delta?.content ?? choice?.message?.content ?? chunk.message?.content ?? "";

        if (thinkingDelta) {
          thinking += thinkingDelta;
          opts.onThinkingDelta?.(thinkingDelta);
        }
        if (contentDelta) {
          content += contentDelta;
          opts.onContentDelta?.(contentDelta);
        }
      }
    }

    const parsed = tryParseJson(content || thinking);
    const result = opts.schema.safeParse(parsed);
    if (!result.success) throw new Error("LLM returned unparseable response");
    return result.data;
  } catch (err) {
    if (err instanceof BrowserLlmOfflineError) throw err;
    throw new BrowserLlmOfflineError();
  } finally {
    window.clearTimeout(timeout);
  }
};

const LlmParseSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  categoryId: z.string(),
  accountId: z.string().optional().nullable(),
  note: z.string().optional().default(""),
  occurredAt: z.string(),
  kind: z.enum(["expense", "income"]),
  confidence: z.number().min(0).max(1).optional().default(0.7),
});

export const parseTransactionInBrowser = async (
  settings: BrowserLlmSettings,
  input: {
    text: string;
    categories: CategoryDto[];
    accounts: AccountDto[];
    currency: CurrencyCode;
  },
): Promise<{ parsed?: z.infer<typeof ParsedTransactionSchema>; offline?: boolean }> => {
  try {
    const raw = await chatJson(settings, {
      system: nlParseSystem(input.categories, input.accounts, input.currency),
      user: `User time: ${new Date().toISOString()}\nInput: ${input.text}`,
      schema: LlmParseSchema,
      temperature: 0.2,
    });
    const normalized = ParsedTransactionSchema.safeParse({
      ...raw,
      occurredAt: new Date(raw.occurredAt).toISOString(),
    });
    if (!normalized.success) return {};
    return { parsed: normalized.data };
  } catch (err) {
    if (err instanceof BrowserLlmOfflineError) return { offline: true };
    throw err;
  }
};

const InsightSchema = z.object({
  summary: z.string(),
  narrative: z.string(),
  callout: z.string().default(""),
});

export interface BrowserInsight {
  offline: boolean;
  summary?: string;
  narrative?: string;
  callout?: string;
}

export const generateInsightsInBrowser = async (
  settings: BrowserLlmSettings,
  input: {
    period: "week" | "month";
    transactions: TransactionDto[];
    categories: CategoryDto[];
    currency: CurrencyCode;
  },
): Promise<BrowserInsight> => {
  if (input.transactions.length === 0) {
    return { offline: false, summary: "No transactions yet.", narrative: "", callout: "" };
  }

  const windowDays = input.period === "week" ? 7 : 30;
  const catMap = new Map(input.categories.map((c) => [c.id, c.label]));
  const expenseTotals = new Map<string, number>();
  const incomeTotals = new Map<string, number>();
  let spent = 0;
  let income = 0;
  for (const t of input.transactions) {
    if (t.kind === "expense") {
      spent += t.amountMinor;
      expenseTotals.set(t.categoryId, (expenseTotals.get(t.categoryId) ?? 0) + t.amountMinor);
    } else {
      income += t.amountMinor;
      incomeTotals.set(t.categoryId, (incomeTotals.get(t.categoryId) ?? 0) + t.amountMinor);
    }
  }

  const fmt = (n: number): string => formatAmount(n, input.currency);
  const expenseLines = [...expenseTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([cid, v]) => `- ${catMap.get(cid) ?? cid}: ${fmt(v)}`);
  const incomeLines = [...incomeTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cid, v]) => `- ${catMap.get(cid) ?? cid}: ${fmt(v)}`);
  const user = [
    `Period: last ${windowDays} days`,
    `Total expenses: ${fmt(spent)} (${input.transactions.filter((t) => t.kind === "expense").length} transactions)`,
    `Total income: ${fmt(income)} (${input.transactions.filter((t) => t.kind === "income").length} transactions)`,
    `Net: ${fmt(income - spent)}`,
    ``,
    `Expense breakdown by category:`,
    ...(expenseLines.length > 0 ? expenseLines : ["- (none)"]),
    ``,
    `Income breakdown by category:`,
    ...(incomeLines.length > 0 ? incomeLines : ["- (none)"]),
  ].join("\n");

  try {
    const raw = await chatJson(settings, {
      system: insightsSystem(input.period, input.currency),
      user,
      schema: InsightSchema,
      temperature: 0.3,
    });
    return { offline: false, ...raw };
  } catch (err) {
    if (err instanceof BrowserLlmOfflineError) return { offline: true };
    throw err;
  }
};

const FinanceAnswerSchema = z.object({
  answer: z.string().min(1),
});

export interface BrowserFinanceAnswer {
  offline: boolean;
  answer?: string;
}

export const askFinanceQuestionInBrowser = async (
  settings: BrowserLlmSettings,
  input: {
    question: string;
    months: number;
    from: string;
    to: string;
    transactions: TransactionDto[];
    categories: CategoryDto[];
    accounts: AccountDto[];
    currency: CurrencyCode;
    limited: boolean;
    onThinkingDelta?: (delta: string) => void;
    onContentDelta?: (delta: string) => void;
  },
): Promise<BrowserFinanceAnswer> => {
  const catMap = new Map(input.categories.map((c) => [c.id, c.label]));
  const acctMap = new Map(input.accounts.map((a) => [a.id, a.label]));
  const categoryTotals = new Map<string, { expense: number; income: number }>();
  const accountTotals = new Map<string, { expense: number; income: number }>();
  let expense = 0;
  let income = 0;

  for (const t of input.transactions) {
    const isIncome = t.kind === "income";
    const amount = t.amountMinor;
    if (isIncome) income += amount;
    else expense += amount;

    const cat = categoryTotals.get(t.categoryId) ?? { expense: 0, income: 0 };
    const acct = accountTotals.get(t.accountId) ?? { expense: 0, income: 0 };
    if (isIncome) {
      cat.income += amount;
      acct.income += amount;
    } else {
      cat.expense += amount;
      acct.expense += amount;
    }
    categoryTotals.set(t.categoryId, cat);
    accountTotals.set(t.accountId, acct);
  }

  const fmt = (n: number): string => formatAmount(n, input.currency);
  const formatTotals = (
    entries: Array<[string, { expense: number; income: number }]>,
    labels: Map<string, string>,
  ) =>
    entries
      .sort((a, b) => b[1].expense + b[1].income - (a[1].expense + a[1].income))
      .slice(0, 16)
      .map(([id, totals]) => {
        const parts = [
          totals.expense > 0 ? `expenses ${fmt(totals.expense)}` : null,
          totals.income > 0 ? `income ${fmt(totals.income)}` : null,
        ].filter(Boolean);
        return `- ${labels.get(id) ?? id}: ${parts.join(", ") || fmt(0)}`;
      });

  const rows = input.transactions.slice(0, 120).map((t) => {
    const date = new Date(t.occurredAt).toISOString().slice(0, 10);
    return {
      id: t.id,
      date,
      kind: t.kind,
      amount: fmt(t.amountMinor),
      amountMinor: t.amountMinor,
      category: catMap.get(t.categoryId) ?? t.categoryId,
      account: acctMap.get(t.accountId) ?? t.accountId,
      note: t.note || "",
    };
  });
  const expenseRows = rows
    .filter((t) => t.kind === "expense")
    .sort((a, b) => a.amountMinor - b.amountMinor);
  const formatRow = (row: (typeof rows)[number] | undefined): string =>
    row
      ? `${row.note || "(no note)"}: ${row.amount} in ${row.category} via ${row.account} on ${row.date}`
      : "(none)";

  const user = [
    `User time: ${new Date().toISOString()}`,
    `Question: ${input.question}`,
    ``,
    `Context window: ${input.months} month${input.months === 1 ? "" : "s"}`,
    `Date range: ${input.from} to ${input.to}`,
    `Currency: ${input.currency}`,
    `Transactions supplied: ${input.transactions.length}${input.limited ? " (limited to latest 500 by API)" : ""}`,
    `Transaction rows shown to model: ${rows.length}`,
    ``,
    `Totals:`,
    `- Expenses: ${fmt(expense)}`,
    `- Income: ${fmt(income)}`,
    `- Net: ${fmt(income - expense)}`,
    ``,
    `Expense extremes by individual transaction:`,
    `- Least expensive purchase: ${formatRow(expenseRows[0])}`,
    `- Most expensive purchase: ${formatRow(expenseRows[expenseRows.length - 1])}`,
    ``,
    `Category totals:`,
    ...formatTotals([...categoryTotals.entries()], catMap),
    ``,
    `Account totals:`,
    ...formatTotals([...accountTotals.entries()], acctMap),
    ``,
    `Transactions, newest first JSON:`,
    JSON.stringify(rows),
  ].join("\n");

  try {
    const raw = await streamChatJson(settings, {
      system: financeChatSystem(input.currency),
      user,
      schema: FinanceAnswerSchema,
      temperature: 0.2,
      timeoutMs: 60_000,
      onThinkingDelta: input.onThinkingDelta,
      onContentDelta: input.onContentDelta,
    });
    return { offline: false, answer: raw.answer };
  } catch (err) {
    if (err instanceof BrowserLlmOfflineError) return { offline: true };
    throw err;
  }
};
