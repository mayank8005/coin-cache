"use client";

import { useRouter } from "next/navigation";
import { PlusMinusButton } from "@/components/primitives/PlusMinusButton";

interface Props {
  aiOnline?: boolean;
}

export function BottomDock({ aiOnline = false }: Props) {
  const router = useRouter();
  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 px-4 pb-7 lg:mx-auto lg:max-w-6xl"
      style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[375px] lg:max-w-none">
        <button
          type="button"
          onClick={() => router.push("/add?kind=expense")}
          className="mb-3 flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-left"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          aria-label="Add via natural language"
        >
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: aiOnline ? "var(--aiLine)" : "var(--fgDim)",
              letterSpacing: "0.12em",
            }}
          >
            ··
          </span>
          <span
            className="flex-1 font-mono"
            style={{
              fontSize: 13,
              color: aiOnline ? "var(--fgMuted)" : "var(--fgDim)",
            }}
          >
            {aiOnline ? "\u201Clunch 14 with sara\u201D" : "add a note\u2026"}
          </span>
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid var(--lineStrong)",
            }}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
              <rect x="3" y="1" width="6" height="9" rx="3" stroke="var(--fgMuted)" strokeWidth="1.2" />
              <path
                d="M1 8 a5 5 0 0 0 10 0 M6 13 v2"
                stroke="var(--fgMuted)"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
        <div className="flex items-center justify-between gap-4">
          <PlusMinusButton kind="minus" size={64} onClick={() => router.push("/add?kind=expense")} />
          <div
            className="flex-1 text-center font-mono uppercase"
            style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.14em" }}
          >
            tap to add · hold for voice
          </div>
          <PlusMinusButton kind="plus" size={72} onClick={() => router.push("/add?kind=income")} />
        </div>
      </div>
    </div>
  );
}
