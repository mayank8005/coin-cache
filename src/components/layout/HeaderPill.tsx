"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface Props {
  name: string;
  onlineAi: boolean;
}

export function HeaderPill({ name, onlineAi }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
          {name}
        </span>
        <span className="font-mono text-[10px] text-fg-dim">·</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">local</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:text-fg"
        >
          settings
        </Link>
        <span
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider"
          style={{ color: onlineAi ? "var(--pos)" : "var(--fgDim)" }}
        >
          <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ background: "currentColor" }} />
          ai {onlineAi ? "on" : "off"}
        </span>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/login" })}
          className="font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:text-fg"
        >
          logout
        </button>
      </div>
    </div>
  );
}
