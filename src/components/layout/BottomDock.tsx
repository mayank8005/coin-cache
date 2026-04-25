"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusMinusButton } from "@/components/primitives/PlusMinusButton";
import { useNlParse, useCreateTransaction, useAccounts } from "@/hooks/api";

interface Props {
  aiOnline?: boolean;
}

type Status = "idle" | "thinking" | "saved";
type FeedbackKind = "info" | "ok" | "warn" | "error";
interface Feedback {
  kind: FeedbackKind;
  msg: string;
}

export function BottomDock({ aiOnline = false }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const parse = useNlParse();
  const create = useCreateTransaction();
  const accounts = useAccounts();
  const timeoutsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const set = timeoutsRef.current;
    return () => {
      for (const id of set) window.clearTimeout(id);
      set.clear();
    };
  }, []);

  const scheduleTimeout = (fn: () => void, ms: number): void => {
    const id = window.setTimeout(() => {
      timeoutsRef.current.delete(id);
      fn();
    }, ms);
    timeoutsRef.current.add(id);
  };

  const showFeedback = (kind: FeedbackKind, msg: string, autoClearMs?: number): void => {
    setFeedback({ kind, msg });
    if (autoClearMs) {
      scheduleTimeout(() => {
        setFeedback((curr) => (curr && curr.msg === msg ? null : curr));
      }, autoClearMs);
    }
  };

  const submit = async (): Promise<void> => {
    const value = text.trim();
    if (!value) return;
    if (!aiOnline) {
      router.push(`/add?kind=expense&note=${encodeURIComponent(value)}`);
      return;
    }
    setStatus("thinking");
    setFeedback(null);
    try {
      const res = await parse.mutateAsync({ text: value });
      if (res.offline) {
        setStatus("idle");
        showFeedback("warn", "AI endpoint unreachable — check Settings → AI endpoint");
        return;
      }
      if (!res.parsed || !res.parsed.amountMinor || res.parsed.amountMinor <= 0) {
        setStatus("idle");
        showFeedback("warn", `Couldn't read an amount from "${value}". Try e.g. "team dinner 30".`);
        return;
      }
      const p = res.parsed;
      const fallbackAcct = accounts.data?.[0]?.id ?? "";
      if (!p.accountId && !fallbackAcct) {
        setStatus("idle");
        showFeedback("error", "No account on file — create one in Settings → New account.");
        return;
      }
      try {
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
      } catch (createErr) {
        setStatus("idle");
        const msg = createErr instanceof Error ? createErr.message : "save failed";
        showFeedback("error", `Couldn't save: ${msg}`);
        return;
      }
      setText("");
      setStatus("saved");
      showFeedback("ok", `Saved: ${p.note ?? value}`, 2500);
      scheduleTimeout(() => setStatus("idle"), 1600);
    } catch (err) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "unexpected error";
      showFeedback("error", `AI parse failed: ${msg}`);
    }
  };

  const placeholder = aiOnline ? '"lunch 14 with sara"' : "ai offline — tap + or − to add";
  const hint =
    status === "thinking" ? "thinking…" : status === "saved" ? "saved ✓" : "tap to add";

  const feedbackColor =
    feedback?.kind === "error"
      ? "var(--neg)"
      : feedback?.kind === "warn"
        ? "var(--neg)"
        : feedback?.kind === "ok"
          ? "var(--pos)"
          : "var(--fgMuted)";

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 px-4 pb-7 lg:mx-auto lg:max-w-6xl"
      style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[375px] lg:max-w-none">
        {feedback ? (
          <div
            role="status"
            className="mb-2 flex items-start justify-between gap-2 rounded-md px-3 py-2"
            style={{
              background: "var(--surface2)",
              border: `1px solid ${feedbackColor}`,
              color: feedbackColor,
              fontSize: 12,
            }}
          >
            <span className="leading-snug">{feedback.msg}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="font-mono"
              style={{ fontSize: 14, lineHeight: 1, color: feedbackColor }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ) : null}
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
