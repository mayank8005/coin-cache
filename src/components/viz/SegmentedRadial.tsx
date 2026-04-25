"use client";

import type { CSSProperties } from "react";
import type { CurrencyCode } from "@/types/design";
import { formatAmount } from "@/utils/format";
import type { CategoryTotal } from "./PieViz";

interface Props {
  totals: CategoryTotal[];
  size?: number;
  spentMinor: number;
  currency: CurrencyCode;
  style?: CSSProperties;
}

const arc = (cx: number, cy: number, r: number, start: number, end: number): string => {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
};

export function SegmentedRadial({ totals, size = 180, spentMinor, currency, style }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.26;
  const usable = size / 2 - innerR - 6;
  const nVis = Math.max(3, totals.length);
  const ringW = Math.max(3, Math.min(7, (usable - (nVis - 1) * 2) / nVis));
  const gap = 2;
  const tones = ["var(--accent)", "var(--fg)", "var(--fgMuted)", "var(--fgDim)"];
  const total = totals.reduce((s, t) => s + Math.abs(t.amountMinor), 0) || 1;

  const empty = totals.length === 0;
  const placeholder: CategoryTotal[] = empty
    ? [
        { id: "p1", label: "", mono: "", amountMinor: 0 },
        { id: "p2", label: "", mono: "", amountMinor: 0 },
        { id: "p3", label: "", mono: "", amountMinor: 0 },
      ]
    : totals;

  return (
    <div className="relative inline-block" style={{ width: size, height: size, ...style }}>
      <svg width={size} height={size}>
        {placeholder.map((t, i) => {
          const r = innerR + ringW / 2 + i * (ringW + gap);
          const frac = Math.min(1, Math.abs(t.amountMinor) / total);
          const start = -Math.PI / 2;
          const end = start + frac * Math.PI * 2 - 0.01;
          const tone = tones[Math.min(i, tones.length - 1)] ?? "var(--fg)";
          return (
            <g key={t.id}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={ringW} />
              {end > start ? (
                <path
                  d={arc(cx, cy, r, start, end)}
                  fill="none"
                  stroke={tone}
                  strokeWidth={ringW}
                  strokeLinecap="round"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ padding: innerR * 0.2 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">spent</span>
        <span
          className="font-mono font-medium tabular-nums"
          style={{ fontSize: size * 0.13, letterSpacing: "-0.04em" }}
        >
          {formatAmount(spentMinor, currency)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-dim">
          {totals.length > 0 ? `${totals.length} categories` : "no spending yet"}
        </span>
      </div>
    </div>
  );
}
