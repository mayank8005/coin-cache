import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { chat, LlmOfflineError } from "@/lib/llm/client";
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
    const totals = new Map<string, number>();
    let spent = 0;
    let income = 0;
    for (const t of txns) {
      const amt = t.amountMinor;
      if (t.kind === "expense") spent += amt;
      else income += amt;
      const key = t.categoryId;
      totals.set(key, (totals.get(key) ?? 0) + (t.kind === "expense" ? amt : 0));
    }
    const summaryLines = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cid, v]) => `- ${catMap.get(cid) ?? cid}: ${formatAmount(v, u.currency as CurrencyCode)}`);
    const userMsg = [
      `Period: last ${windowDays} days`,
      `Total spent: ${formatAmount(spent, u.currency as CurrencyCode)}`,
      `Total income: ${formatAmount(income, u.currency as CurrencyCode)}`,
      `Transaction count: ${txns.length}`,
      `Top categories:`,
      ...summaryLines,
    ].join("\n");

    try {
      const raw = await chat({
        system: insightsSystem(period, u.currency),
        user: userMsg,
        schema: InsightSchema,
        temperature: 0.3,
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
