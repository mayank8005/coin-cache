"use client";

import { useInsights } from "@/hooks/api";

export function InsightsPanel() {
  const { data, isLoading } = useInsights("month");

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
