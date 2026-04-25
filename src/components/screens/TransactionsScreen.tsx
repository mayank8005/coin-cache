"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";
import type { ChipRep, CurrencyCode } from "@/types/design";
import { TxnRow } from "@/components/primitives/TxnRow";
import { BottomDock } from "@/components/layout/BottomDock";
import { useTransactions } from "@/hooks/api";
import { formatAmount, formatDayHeader } from "@/utils/format";
import { cn } from "@/utils/cn";

interface Props {
  initialTransactions: TransactionDto[];
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  chipRep: ChipRep;
}

type FilterKind = "all" | "expense" | "income" | "flagged";

export function TransactionsScreen({
  initialTransactions,
  categories,
  accounts,
  currency,
  chipRep,
}: Props) {
  const router = useRouter();
  const [monthOffset, setMonthOffset] = useState(0);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [acctId, setAcctId] = useState<string | null>(null);

  const { from, to, isCurrent } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
    return { from: start.toISOString(), to: end.toISOString(), isCurrent: monthOffset === 0 };
  }, [monthOffset]);

  const query = useTransactions({ from, to, limit: 500 });
  const txns = isCurrent && !query.data ? initialTransactions : query.data ?? [];

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const acctMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (filter === "expense" && t.kind !== "expense") return false;
      if (filter === "income" && t.kind !== "income") return false;
      if (filter === "flagged" && !t.flagged) return false;
      if (acctId && t.accountId !== acctId) return false;
      return true;
    });
  }, [txns, filter, acctId]);

  const groups = useMemo(() => {
    const m = new Map<string, { date: Date; items: TransactionDto[]; total: number }>();
    for (const t of filtered) {
      const d = new Date(t.occurredAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = m.get(key);
      const delta = t.kind === "income" ? t.amountMinor : -t.amountMinor;
      if (existing) {
        existing.items.push(t);
        existing.total += delta;
      } else {
        m.set(key, { date: d, items: [t], total: delta });
      }
    }
    return [...m.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filtered]);

  const monthLabel = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthOffset]);

  return (
    <div className="relative min-h-dvh pb-56">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider text-fg-muted"
        >
          ← back
        </button>
        <h1 className="font-display text-[16px] font-medium">Transactions</h1>
        <span className="w-12" />
      </header>

      <div className="mb-3 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setMonthOffset((m) => m - 1)}
          className="font-mono text-[14px] text-fg-muted"
        >
          ‹
        </button>
        <div className="font-mono text-[12px] uppercase tracking-wider">{monthLabel}</div>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
          disabled={monthOffset >= 0}
          className="font-mono text-[14px] text-fg-muted disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["all", "expense", "income", "flagged"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "shrink-0 rounded-pill border px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors duration-med",
              filter === k
                ? "border-transparent bg-fg text-bg"
                : "border-line-strong text-fg-muted",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {accounts.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => setAcctId(null)}
            className={cn(
              "shrink-0 rounded-pill border px-3 py-1.5 text-[11px] font-medium transition-colors duration-med",
              acctId === null ? "border-transparent bg-surface2 text-fg" : "border-line-strong text-fg-muted",
            )}
          >
            all accounts
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAcctId(a.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-pill border px-3 py-1.5 text-[11px] font-medium transition-colors duration-med",
                acctId === a.id ? "border-transparent bg-surface2 text-fg" : "border-line-strong text-fg-muted",
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: a.colorHex }}
              />
              {a.label}
            </button>
          ))}
        </div>
      ) : null}

      <section className="px-4">
        {groups.length === 0 ? (
          <div className="card px-4 py-12 text-center text-[12px] text-fg-muted">
            No transactions for this view.
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.date.toISOString()} className="mb-4">
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="txt-mono-label">{formatDayHeader(g.date)}</span>
                <span
                  className="font-mono text-[11px] tabular-nums"
                  style={{ color: g.total >= 0 ? "var(--pos)" : "var(--fgMuted)" }}
                >
                  {formatAmount(g.total, currency, { signed: true })}
                </span>
              </div>
              <div className="card px-3 py-1">
                {g.items.map((t) => {
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
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      <BottomDock />
    </div>
  );
}
