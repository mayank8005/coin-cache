"use client";

import type { ReactNode } from "react";
import type { ChipRep, CurrencyCode } from "@/types/design";
import { Amount } from "./Amount";
import { AIMark } from "./AIMark";
import { CategoryIcon } from "./CategoryIcon";
import { formatRelativeDate } from "@/utils/format";

interface Props {
  categoryLabel: string;
  categoryMono: string;
  categoryIconId: string;
  accountLabel: string;
  accountColor: string;
  note: string;
  amountMinor: number;
  kind: string;
  occurredAt: Date;
  ai?: boolean;
  aiConfidence?: number | null;
  currency: CurrencyCode;
  rep?: ChipRep;
  onClick?: () => void;
}

export function TxnRow({
  categoryLabel,
  categoryMono,
  categoryIconId,
  accountLabel,
  accountColor,
  note,
  amountMinor,
  kind,
  occurredAt,
  ai,
  aiConfidence,
  currency,
  rep = "mono",
  onClick,
}: Props) {
  const signed = kind === "income" ? amountMinor : -amountMinor;
  const interactive = !!onClick;
  const className = `flex min-h-[44px] w-full items-center gap-3 border-b border-line py-2.5 pr-3 text-left last:border-b-0 ${interactive ? "transition-colors duration-fast hover:bg-surface2" : ""}`;
  const children: ReactNode = (
    <>
      <span className="flex w-[28px] items-center justify-center text-fg-muted">
        {rep === "icon" ? (
          <CategoryIcon id={categoryIconId} size={18} />
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-wider">{categoryMono}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-fg">{note || categoryLabel}</div>
        <div className="flex items-center gap-2 text-[10px] text-fg-dim">
          <span
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{ background: accountColor }}
          />
          <span className="font-mono uppercase tracking-wider">{accountLabel}</span>
          <span>·</span>
          <span className="font-mono" suppressHydrationWarning>
            {formatRelativeDate(occurredAt)}
          </span>
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
    </>
  );
  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}
