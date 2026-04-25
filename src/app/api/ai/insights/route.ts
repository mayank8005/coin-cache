import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { chat, LlmOfflineError, userLlmConfig } from "@/lib/llm/client";
import { insightsSystem } from "@/lib/llm/prompts";
import { listTransactions, categoriesForUser } from "@/lib/repo";
import { formatAmount } from "@/utils/format";
import { ok, withUser } from "@/lib/api-helpers";
import type { CurrencyCode } from "@/types/design";
import { newId } from "@/utils/id";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const InsightSchema = z.object({
  summary: z.string(),
  narrative: z.string(),
  callout: z.string().default(""),
});

export const GET = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") === "month" ? "month" : "week";
    const cached = await prisma.insightCache.findUnique({
      where: { userId_period: { userId: u.id, period } },
    });
    if (cached && Date.now() - cached.generatedAt.getTime() < CACHE_TTL_MS) {
      return ok(JSON.parse(cached.payload));
    }

    const windowDays = period === "week" ? 7 : 30;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const [txns, cats] = await Promise.all([
      listTransactions(u.id, { from, limit: 500 }),
      categoriesForUser(u.id),
    ]);
    if (txns.length === 0) {
      const payload = { offline: false, summary: "No transactions yet.", narrative: "", callout: "" };
      return ok(payload);
    }
    const catMap = new Map(cats.map((c) => [c.id, c.label]));
    const expenseTotals = new Map<string, number>();
    const incomeTotals = new Map<string, number>();
    let spent = 0;
    let income = 0;
    for (const t of txns) {
      const amt = t.amountMinor;
      if (t.kind === "expense") {
        spent += amt;
        expenseTotals.set(t.categoryId, (expenseTotals.get(t.categoryId) ?? 0) + amt);
      } else {
        income += amt;
        incomeTotals.set(t.categoryId, (incomeTotals.get(t.categoryId) ?? 0) + amt);
      }
    }
    const fmt = (n: number): string => formatAmount(n, u.currency as CurrencyCode);
    const expenseLines = [...expenseTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cid, v]) => `- ${catMap.get(cid) ?? cid}: ${fmt(v)}`);
    const incomeLines = [...incomeTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cid, v]) => `- ${catMap.get(cid) ?? cid}: ${fmt(v)}`);
    const userMsg = [
      `Period: last ${windowDays} days`,
      `Total expenses: ${fmt(spent)} (${txns.filter((t) => t.kind === "expense").length} transactions)`,
      `Total income: ${fmt(income)} (${txns.filter((t) => t.kind === "income").length} transactions)`,
      `Net: ${fmt(income - spent)}`,
      ``,
      `Expense breakdown by category:`,
      ...(expenseLines.length > 0 ? expenseLines : ["- (none)"]),
      ``,
      `Income breakdown by category:`,
      ...(incomeLines.length > 0 ? incomeLines : ["- (none)"]),
    ].join("\n");

    try {
      const raw = await chat({
        system: insightsSystem(period, u.currency),
        user: userMsg,
        schema: InsightSchema,
        temperature: 0.3,
        timeoutMs: 90_000,
        config: userLlmConfig(u),
      });
      const payload = { offline: false, ...raw };
      await prisma.insightCache.upsert({
        where: { userId_period: { userId: u.id, period } },
        create: {
          id: newId(),
          userId: u.id,
          period,
          payload: JSON.stringify(payload),
        },
        update: { payload: JSON.stringify(payload), generatedAt: new Date() },
      });
      return ok(payload);
    } catch (err) {
      if (err instanceof LlmOfflineError) {
        return ok({ offline: true });
      }
      throw err;
    }
  });
