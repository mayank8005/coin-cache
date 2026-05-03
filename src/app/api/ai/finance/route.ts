import type { NextResponse } from "next/server";
import { z } from "zod";
import { chat, LlmOfflineError, userLlmConfig } from "@/lib/llm/client";
import { financeChatSystem } from "@/lib/llm/prompts";
import { accountsForUser, categoriesForUser, listTransactions } from "@/lib/repo";
import { ok, parseJson, withUser } from "@/lib/api-helpers";
import { formatAmount } from "@/utils/format";
import type { CurrencyCode } from "@/types/design";

const FinanceQuestionSchema = z.object({
  question: z.string().min(1).max(500),
  months: z.number().int().min(1).max(6),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

const FinanceAnswerSchema = z.object({
  answer: z.string().min(1),
});

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const input = await parseJson(req, FinanceQuestionSchema);
    const [txns, cats, accts] = await Promise.all([
      listTransactions(u.id, {
        from: new Date(input.from),
        to: new Date(input.to),
        limit: 500,
      }),
      categoriesForUser(u.id),
      accountsForUser(u.id),
    ]);

    const catMap = new Map(cats.map((c) => [c.id, c.label]));
    const acctMap = new Map(accts.map((a) => [a.id, a.label]));
    const categoryTotals = new Map<string, { expense: number; income: number }>();
    const accountTotals = new Map<string, { expense: number; income: number }>();
    let expense = 0;
    let income = 0;

    for (const t of txns) {
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

    const currency = u.currency as CurrencyCode;
    const fmt = (n: number): string => formatAmount(n, currency);
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

    const rows = txns.slice(0, 120).map((t) => {
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

    const userMsg = [
      `User time: ${new Date().toISOString()}`,
      `Question: ${input.question}`,
      ``,
      `Context window: ${input.months} month${input.months === 1 ? "" : "s"}`,
      `Date range: ${input.from} to ${input.to}`,
      `Currency: ${currency}`,
      `Transactions supplied: ${txns.length}${txns.length >= 500 ? " (limited to latest 500 by API)" : ""}`,
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
      const raw = await chat({
        system: financeChatSystem(currency),
        user: userMsg,
        schema: FinanceAnswerSchema,
        temperature: 0.2,
        timeoutMs: 90_000,
        config: userLlmConfig(u),
      });
      return ok({ offline: false, answer: raw.answer });
    } catch (err) {
      if (err instanceof LlmOfflineError) return ok({ offline: true });
      throw err;
    }
  });
