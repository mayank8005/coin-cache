"use client";

import { type CSSProperties, useState } from "react";
import type { CurrencyCode } from "@/types/design";
import { formatAmount } from "@/utils/format";

export interface CategoryTotal {
  id: string;
  label: string;
  mono: string;
  amountMinor: number;
  colorHex?: string;
}

interface Props {
  totals: CategoryTotal[];
  size?: number;
  spentMinor: number;
  budgetMinor: number;
  currency: CurrencyCode;
  style?: CSSProperties;
}

const annular = (
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string => {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const x1 = cx + rOuter * Math.cos(start);
  const y1 = cy + rOuter * Math.sin(start);
  const x2 = cx + rOuter * Math.cos(end);
  const y2 = cy + rOuter * Math.sin(end);
  const x3 = cx + rInner * Math.cos(end);
  const y3 = cy + rInner * Math.sin(end);
  const x4 = cx + rInner * Math.cos(start);
  const y4 = cy + rInner * Math.sin(start);
  return `M${x1},${y1} A${rOuter},${rOuter} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${largeArc} 0 ${x4},${y4} Z`;
};

export function PieViz({ totals, size = 180, spentMinor, budgetMinor, currency, style }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.58;
  const total = totals.reduce((s, t) => s + Math.abs(t.amountMinor), 0) || 1;
  const gap = 0.014;
  let cursor = -Math.PI / 2;
  const toneLadder = ["var(--fg)", "var(--fgMuted)", "var(--fgDim)", "var(--lineStrong)", "var(--line)"];

  const active = hover ?? null;

  return (
    <div className="relative inline-block" style={{ width: size, height: size, ...style }}>
      <svg width={size} height={size}>
        {totals.map((t, i) => {
          const frac = Math.abs(t.amountMinor) / total;
          const start = cursor + gap / 2;
          const end = cursor + frac * Math.PI * 2 - gap / 2;
          cursor += frac * Math.PI * 2;
          if (end <= start) return null;
          const isActive = active === t.id;
          const isDim = active !== null && !isActive;
          const ro = isActive ? outerR + 2 : outerR;
          const ri = isActive ? innerR - 1 : innerR;
          const fill = i === 0 ? "var(--accent)" : (toneLadder[i % toneLadder.length] ?? "var(--fg)");
          return (
            <path
              key={t.id}
              d={annular(cx, cy, ro, ri, start, end)}
              fill={fill}
              stroke="var(--bg)"
              strokeWidth={1.5}
              style={{
                cursor: "pointer",
                opacity: isDim ? 0.35 : 1,
                transition: "opacity 160ms",
              }}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ padding: innerR * 0.2 }}
      >
        {active ? (
          <>
            <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
              {totals.find((t) => t.id === active)?.label}
            </span>
            <span
              className="font-mono font-medium tabular-nums"
              style={{ fontSize: size * 0.14, letterSpacing: "-0.04em" }}
            >
              {formatAmount(Math.abs(totals.find((t) => t.id === active)?.amountMinor ?? 0), currency)}
            </span>
          </>
        ) : (
          <>
            <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">spent</span>
            <span
              className="font-mono font-medium tabular-nums"
              style={{ fontSize: size * 0.14, letterSpacing: "-0.04em" }}
            >
              {formatAmount(spentMinor, currency)}
            </span>
            <span className="font-mono text-[10px] text-fg-dim">
              {budgetMinor > 0 ? Math.round((spentMinor / budgetMinor) * 100) : 0}% of{" "}
              {formatAmount(budgetMinor, currency, { fractionDigits: 0 })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
