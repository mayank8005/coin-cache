"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";
import type { CurrencyCode, VizStyle } from "@/types/design";
import { HeaderPill } from "@/components/layout/HeaderPill";
import { BottomDock } from "@/components/layout/BottomDock";
import { InsightsPanel } from "@/components/layout/InsightsPanel";
import { Amount } from "@/components/primitives/Amount";
import { TxnRow } from "@/components/primitives/TxnRow";
import { CategoryViz } from "@/components/viz/CategoryViz";
import type { CategoryTotal } from "@/components/viz/PieViz";
import { formatAmount } from "@/utils/format";

interface Props {
  displayName: string;
  transactions: TransactionDto[];
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  vizStyle: VizStyle;
  aiOnline: boolean;
}

export function HomeScreen({
  displayName,
  transactions,
  categories,
  accounts,
  currency,
  vizStyle,
  aiOnline,
}: Props) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const acctMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const { spent, income, budget, totals } = useMemo(() => {
    let s = 0;
    let i = 0;
    let b = 0;
    for (const c of categories) b += c.monthlyBudgetMinor ?? 0;
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.kind === "expense") {
        s += t.amountMinor;
        byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amountMinor);
      } else {
        i += t.amountMinor;
      }
    }
    const catTotals: CategoryTotal[] = [...byCat.entries()]
      .map(([id, amt]) => {
        const c = catMap.get(id);
        return {
          id,
          label: c?.label ?? id,
          mono: c?.mono ?? "··",
          amountMinor: amt,
          colorHex: c?.colorHex,
        };
      })
      .sort((a, b) => b.amountMinor - a.amountMinor);
    return { spent: s, income: i, budget: b || Math.max(s * 1.1, 100_000), totals: catTotals };
  }, [transactions, categories, catMap]);

  const left = Math.max(0, budget - spent);
  const daysLeft = 30 - new Date().getDate();
  const daily = daysLeft > 0 ? Math.round(left / daysLeft) : 0;

  const recent = transactions.slice(0, 5);

  return (
    <div className="relative min-h-dvh pb-28 lg:mx-auto lg:max-w-6xl">
      <HeaderPill name={displayName} onlineAi={aiOnline} />

      <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 lg:px-4">
      {/* Hero */}
      <section className="px-4 lg:px-0">
        <div className="card px-4 py-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="txt-mono-label">left to spend · {daysLeft} days</div>
              <div
                className="mt-1 font-display font-medium tabular-nums"
                style={{ fontSize: 48, letterSpacing: "-0.04em" }}
              >
                {formatAmount(left, currency)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4">
                <Stat label="spent" value={formatAmount(spent, currency)} />
                <Stat label="budget" value={formatAmount(budget, currency)} />
                <Stat label="income" value={formatAmount(income, currency)} tone="pos" />
                <Stat label="daily" value={formatAmount(daily, currency)} />
              </div>
            </div>
            <div className="pl-2">
              <CategoryViz
                totals={totals.length > 0 ? totals : [{ id: "none", label: "none", mono: "··", amountMinor: 1 }]}
                vizStyle={vizStyle}
                size={150}
                spentMinor={spent}
                budgetMinor={budget}
                currency={currency}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recent transactions */}
      <section className="mt-6 px-4 lg:mt-0 lg:px-0">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-[15px] font-medium">Recent</h2>
          <Link href="/transactions" className="font-mono text-[11px] uppercase text-fg-muted">
            view all
          </Link>
        </div>
        <div className="card px-3 py-1">
          {recent.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-fg-muted">
              No transactions yet. Tap + or − to add one.
            </p>
          ) : (
            recent.map((t) => {
              const cat = catMap.get(t.categoryId);
              const acct = acctMap.get(t.accountId);
              return (
                <TxnRow
                  key={t.id}
                  categoryLabel={cat?.label ?? "Uncategorised"}
                  categoryMono={cat?.mono ?? "··"}
                  accountLabel={acct?.label ?? ""}
                  accountColor={acct?.colorHex ?? "var(--fgDim)"}
                  note={t.note}
                  amountMinor={t.amountMinor}
                  kind={t.kind}
                  occurredAt={new Date(t.occurredAt)}
                  ai={t.aiCategorized}
                  aiConfidence={t.aiConfidence}
                  currency={currency}
                />
              );
            })
          )}
        </div>
      </section>

      </div>

      <section className="mt-6 px-4 lg:px-4">
        <InsightsPanel />
      </section>

      <BottomDock />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" }) {
  return (
    <div>
      <div className="txt-mono-label">{label}</div>
      <div
        className="font-mono font-medium tabular-nums"
        style={{ fontSize: 14, letterSpacing: "-0.03em", color: tone === "pos" ? "var(--pos)" : "var(--fg)" }}
      >
        {value}
      </div>
    </div>
  );
}
