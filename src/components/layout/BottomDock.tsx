"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusMinusButton } from "@/components/primitives/PlusMinusButton";
import { useNlParse, useCreateTransaction, useAccounts } from "@/hooks/api";

interface Props {
  aiOnline?: boolean;
}

type Status = "idle" | "thinking" | "saved" | "offline" | "error" | "no_amount";

export function BottomDock({ aiOnline = false }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const parse = useNlParse();
  const create = useCreateTransaction();
  const accounts = useAccounts();

  const submit = async (): Promise<void> => {
    const value = text.trim();
    if (!value) return;
    if (!aiOnline) {
      router.push(`/add?kind=expense&note=${encodeURIComponent(value)}`);
      return;
    }
    setStatus("thinking");
    try {
      const res = await parse.mutateAsync({ text: value });
      if (res.offline) {
        setStatus("offline");
        return;
      }
      if (!res.parsed) {
        setStatus("no_amount");
        setTimeout(() => setStatus("idle"), 3500);
        return;
      }
      const p = res.parsed;
      if (!p.amountMinor || p.amountMinor <= 0) {
        setStatus("no_amount");
        setTimeout(() => setStatus("idle"), 3500);
        return;
      }
      const fallbackAcct = accounts.data?.[0]?.id ?? "";
      await create.mutateAsync({
        accountId: p.accountId ?? fallbackAcct,
        categoryId: p.categoryId,
        amountMinor: p.amountMinor,
        note: p.note ?? value,
        occurredAt: p.occurredAt,
        kind: p.kind,
        aiCategorized: true,
        aiConfidence: p.confidence,
        flagged: p.confidence < 0.6,
      });
      setText("");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
    }
  };

  const placeholder = aiOnline ? '"lunch 14 with sara"' : "ai offline — tap + or − to add";
  const hint =
    status === "thinking"
      ? "thinking…"
      : status === "saved"
        ? "saved ✓"
        : status === "offline"
          ? "ai offline"
          : status === "error"
            ? "could not save"
            : status === "no_amount"
              ? "include an amount, e.g. \"lunch 14\""
              : "tap to add";

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 px-4 pb-7 lg:mx-auto lg:max-w-6xl"
      style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[375px] lg:max-w-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mb-3 flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: aiOnline ? "var(--aiLine)" : "var(--fgDim)",
              letterSpacing: "0.12em",
            }}
            aria-hidden
          >
            ··
          </span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!aiOnline || status === "thinking"}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent font-mono outline-none disabled:opacity-60"
            style={{
              fontSize: 13,
              color: "var(--fg)",
            }}
            aria-label="Add transaction via natural language"
          />
          <button
            type="submit"
            disabled={!aiOnline || status === "thinking" || text.trim() === ""}
            className="inline-flex items-center justify-center disabled:opacity-40"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid var(--lineStrong)",
              color: "var(--fg)",
            }}
            aria-label="Submit"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6h8M6 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </form>
        <div className="flex items-center justify-between gap-4">
          <PlusMinusButton kind="minus" size={64} onClick={() => router.push("/add?kind=expense")} />
          <div
            className="flex-1 text-center font-mono uppercase"
            style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.14em" }}
          >
            {hint}
          </div>
          <PlusMinusButton kind="plus" size={72} onClick={() => router.push("/add?kind=income")} />
        </div>
      </div>
    </div>
  );
}
