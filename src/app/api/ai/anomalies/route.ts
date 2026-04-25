import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, LlmOfflineError, userLlmConfig } from "@/lib/llm/client";
import { anomaliesSystem } from "@/lib/llm/prompts";
import { listTransactions, categoriesForUser } from "@/lib/repo";
import { ok, withUser } from "@/lib/api-helpers";

const AnomaliesSchema = z.object({
  anomalies: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : sorted[mid] ?? 0;
};

export const POST = (): Promise<NextResponse> =>
  withUser(async (u) => {
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [txns, cats] = await Promise.all([
      listTransactions(u.id, { from, limit: 500 }),
      categoriesForUser(u.id),
    ]);

    if (txns.length < 5) return ok({ offline: false, anomalies: [] });

    const catMap = new Map(cats.map((c) => [c.id, c.label]));
    const amountsByCat = new Map<string, number[]>();
    for (const t of txns) {
      if (t.kind !== "expense") continue;
      const arr = amountsByCat.get(t.categoryId) ?? [];
      arr.push(t.amountMinor);
      amountsByCat.set(t.categoryId, arr);
    }
    const medians: Record<string, number> = {};
    for (const [cid, arr] of amountsByCat) medians[catMap.get(cid) ?? cid] = median(arr);

    const payload = {
      transactions: txns.slice(0, 50).map((t) => ({
        id: t.id,
        amountMinor: t.amountMinor,
        categoryLabel: catMap.get(t.categoryId) ?? t.categoryId,
        note: t.note,
        kind: t.kind,
        occurredAt: t.occurredAt,
      })),
      categoryMedians: medians,
    };

    try {
      const result = await chat({
        system: anomaliesSystem(u.currency),
        user: JSON.stringify(payload),
        schema: AnomaliesSchema,
        temperature: 0.1,
        timeoutMs: 60_000,
        config: userLlmConfig(u),
      });
      return ok({ offline: false, anomalies: result.anomalies });
    } catch (err) {
      if (err instanceof LlmOfflineError) return ok({ offline: true, anomalies: [] });
      throw err;
    }
  });
