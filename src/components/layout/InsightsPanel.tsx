"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryDto, TransactionDto } from "@/lib/dto";
import type { CurrencyCode } from "@/types/design";
import {
  generateInsightsInBrowser,
  type BrowserInsight,
  type BrowserLlmSettings,
} from "@/lib/llm/browser-client";

interface Props {
  transactions: TransactionDto[];
  categories: CategoryDto[];
  currency: CurrencyCode;
  llmSettings: BrowserLlmSettings;
  onOnlineChange?: (online: boolean) => void;
}

export function InsightsPanel({
  transactions,
  categories,
  currency,
  llmSettings,
  onOnlineChange,
}: Props) {
  const [data, setData] = useState<BrowserInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const recentTransactions = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return transactions.filter((t) => new Date(t.occurredAt).getTime() >= cutoff);
  }, [transactions]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    generateInsightsInBrowser(llmSettings, {
      period: "month",
      transactions: recentTransactions,
      categories,
      currency,
    })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        onOnlineChange?.(!result.offline);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ offline: true });
        onOnlineChange?.(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categories, currency, llmSettings, onOnlineChange, recentTransactions]);

  if (isLoading) {
    return (
      <div className="card-sunk p-4 text-[12px] text-fg-muted">
        <div className="txt-mono-label mb-2">insights</div>
        Loading…
      </div>
    );
  }

  if (!data || data.offline || !data.narrative) {
    return (
      <div
        className="p-4 text-[12px] text-fg-muted"
        style={{
          background: "var(--aiTint)",
          border: "1px dashed var(--aiLine)",
          borderRadius: 12,
        }}
      >
        <div className="txt-mono-label mb-2">insights · offline</div>
        Configure an LLM endpoint to see weekly/monthly narratives. Your spending stays local.
      </div>
    );
  }

  return (
    <div
      className="p-4"
      style={{
        background: "var(--aiTint)",
        border: "1px dashed var(--aiLine)",
        borderRadius: 12,
      }}
    >
      <div className="txt-mono-label mb-2">this month · ai</div>
      {data.summary ? (
        <div className="font-display text-[14px] font-medium mb-2">{data.summary}</div>
      ) : null}
      <p className="text-[12px] text-fg leading-relaxed">{data.narrative}</p>
      {data.callout ? (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
          {data.callout}
        </div>
      ) : null}
    </div>
  );
}
