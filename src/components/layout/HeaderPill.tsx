"use client";

import Link from "next/link";

interface Props {
  name: string;
  period: string;
  onlineAi: boolean;
}

export function HeaderPill({ name, period, onlineAi }: Props) {
  return (
    <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
      <div className="min-w-0 flex-1">
        <div
          className="font-mono uppercase"
          style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.14em" }}
          suppressHydrationWarning
        >
          {period}
        </div>
        <div
          className="mt-0.5 truncate font-display"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em" }}
        >
          {name}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-mono uppercase"
          style={{
            fontSize: 10,
            color: onlineAi ? "var(--fgMuted)" : "var(--fgDim)",
            letterSpacing: "0.1em",
            border: "1px solid var(--line)",
          }}
        >
          <span
            className="inline-block"
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: onlineAi ? "var(--accent)" : "var(--fgDim)",
            }}
          />
          {onlineAi ? "ai on" : "offline"}
        </span>
        <Link
          href="/settings"
          aria-label="Settings"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
          style={{ border: "1px solid var(--line)", color: "var(--fgMuted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
