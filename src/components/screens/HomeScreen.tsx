"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";
import type { ChipRep, CurrencyCode, VizStyle } from "@/types/design";
import { HeaderPill } from "@/components/layout/HeaderPill";
import { BottomDock } from "@/components/layout/BottomDock";
import { InsightsPanel } from "@/components/layout/InsightsPanel";
import { TransactionEditSheet } from "@/components/layout/TransactionEditSheet";
import { Amount } from "@/components/primitives/Amount";
import { TxnRow } from "@/components/primitives/TxnRow";
import { CategoryViz } from "@/components/viz/CategoryViz";
import type { CategoryTotal } from "@/components/viz/PieViz";
import { browserLlmHealth } from "@/lib/llm/browser-client";

interface Props {
  displayName: string;
  transactions: TransactionDto[];
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  vizStyle: VizStyle;
  chipRep: ChipRep;
  llmBaseUrl: string | null;
  llmApiKey: string | null;
  llmModel: string | null;
}

export function HomeScreen({
  displayName,
  transactions,
  categories,
  accounts,
  currency,
  vizStyle,
  chipRep,
  llmBaseUrl,
  llmApiKey,
  llmModel,
}: Props) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const acctMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiOnline, setAiOnline] = useState(false);
  const llmSettings = useMemo(
    () => ({ llmBaseUrl, llmApiKey, llmModel }),
    [llmBaseUrl, llmApiKey, llmModel],
  );

  useEffect(() => {
    let cancelled = false;
    browserLlmHealth(llmSettings)
      .then((online) => {
        if (!cancelled) setAiOnline(online);
      })
      .catch(() => {
        if (!cancelled) setAiOnline(false);
      });
    return () => {
      cancelled = true;
    };
  }, [llmSettings]);

  const { spent, income, totals } = useMemo(() => {
    let s = 0;
    let i = 0;
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
    return { spent: s, income: i, totals: catTotals };
  }, [transactions, catMap]);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  const recent = transactions.slice(0, 6);

  const monthName = now.toLocaleString("en-US", { month: "long" });
  const weekOfMonth = Math.ceil(now.getDate() / 7);
  const period = `${monthName} · Week ${weekOfMonth}`;

  return (
    <div
      className="relative min-h-dvh pb-56 lg:mx-auto lg:max-w-6xl lg:pb-44"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <HeaderPill name={displayName} period={period} onlineAi={aiOnline} />

      <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 lg:px-4">
        {/* Hero — viz + balance line (per design) */}
        <section className="lg:px-0">
          <div className="flex justify-center px-4 pb-1.5 pt-4">
            <CategoryViz
              totals={totals}
              vizStyle={vizStyle}
              size={248}
              spentMinor={spent}
              currency={currency}
            />
          </div>

          <div className="flex items-baseline justify-between px-6 pb-3 pt-1">
            <div>
              <div className="txt-mono-label">Spent this month</div>
              <Amount minor={spent} size={26} currency={currency} tone="fg" />
              <div className="mt-0.5 txt-mono-label" suppressHydrationWarning>
                day {dayOfMonth} of {daysInMonth}
              </div>
            </div>
            <div className="text-right">
              <div className="txt-mono-label">Income</div>
              <Amount minor={income} size={26} currency={currency} tone="pos" />
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
                    categoryIconId={cat?.iconId ?? "misc"}
                    rep={chipRep}
                    accountLabel={acct?.label ?? ""}
                    accountColor={acct?.colorHex ?? "var(--fgDim)"}
                    note={t.note}
                    amountMinor={t.amountMinor}
                    kind={t.kind}
                    occurredAt={new Date(t.occurredAt)}
                    ai={t.aiCategorized}
                    aiConfidence={t.aiConfidence}
                    currency={currency}
                    onClick={() => setEditingId(t.id)}
                  />
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 px-4 lg:px-4">
        <InsightsPanel
          transactions={transactions}
          categories={categories}
          currency={currency}
          llmSettings={llmSettings}
          onOnlineChange={setAiOnline}
        />
      </section>

      <BottomDock
        aiOnline={aiOnline}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        currency={currency}
        llmSettings={llmSettings}
      />

      {editingId
        ? (() => {
            const editing = transactions.find((t) => t.id === editingId);
            if (!editing) return null;
            return (
              <TransactionEditSheet
                key={editing.id}
                txn={editing}
                categories={categories}
                accounts={accounts}
                currency={currency}
                onClose={() => setEditingId(null)}
              />
            );
          })()
        : null}
    </div>
  );
}
