"use client";

import type { CurrencyCode } from "@/types/design";
import { Amount } from "./Amount";
import { AIMark } from "./AIMark";
import { formatRelativeDate } from "@/utils/format";

interface Props {
  categoryLabel: string;
  categoryMono: string;
  accountLabel: string;
  accountColor: string;
  note: string;
  amountMinor: number;
  kind: string;
  occurredAt: Date;
  ai?: boolean;
  aiConfidence?: number | null;
  currency: CurrencyCode;
}

export function TxnRow({
  categoryLabel,
  categoryMono,
  accountLabel,
  accountColor,
  note,
  amountMinor,
  kind,
  occurredAt,
  ai,
  aiConfidence,
  currency,
}: Props) {
  const signed = kind === "income" ? amountMinor : -amountMinor;
  return (
    <div className="flex items-center gap-3 border-b border-line py-2 pr-3 last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted w-[28px]">
        {categoryMono}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-fg">
          {note || categoryLabel}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-fg-dim">
          <span
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{ background: accountColor }}
          />
          <span className="font-mono uppercase tracking-wider">{accountLabel}</span>
          <span>·</span>
          <span className="font-mono">{formatRelativeDate(occurredAt)}</span>
          {ai ? (
            <>
              <span>·</span>
              <AIMark variant="glyph" confidence={aiConfidence ?? undefined}>
                ai
              </AIMark>
            </>
          ) : null}
        </div>
      </div>
      <Amount minor={signed} currency={currency} signed size={14} />
    </div>
  );
}
