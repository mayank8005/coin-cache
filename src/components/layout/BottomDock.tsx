"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";
import type { CurrencyCode } from "@/types/design";
import { PlusMinusButton } from "@/components/primitives/PlusMinusButton";
import { useTransactions } from "@/hooks/api";
import { askFinanceQuestionInBrowser, type BrowserLlmSettings } from "@/lib/llm/browser-client";

interface Props {
  aiOnline?: boolean;
  transactions: TransactionDto[];
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  llmSettings: BrowserLlmSettings;
}

type Status = "idle" | "thinking";
type FeedbackKind = "info" | "ok" | "warn" | "error";
interface Feedback {
  kind: FeedbackKind;
  msg: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  state?: "thinking";
}

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

const monthWindow = (months: number): { from: string; to: string } => {
  const now = new Date();
  now.setMilliseconds(0);
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  start.setHours(0, 0, 0, 0);
  return { from: start.toISOString(), to: now.toISOString() };
};

export function BottomDock({
  aiOnline = false,
  transactions,
  categories,
  accounts,
  currency,
  llmSettings,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<(typeof MONTH_OPTIONS)[number]>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const timeoutsRef = useRef<Set<number>>(new Set());
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const range = useMemo(() => monthWindow(selectedMonths), [selectedMonths]);
  const expandedTransactions = useTransactions(
    { from: range.from, to: range.to, limit: 500 },
    { enabled: selectedMonths > 1 },
  );

  const contextTransactions =
    selectedMonths === 1 ? transactions : (expandedTransactions.data ?? []);
  const contextLimited = selectedMonths > 1 && (expandedTransactions.data?.length ?? 0) >= 500;
  const contextLoading = selectedMonths > 1 && expandedTransactions.isFetching;
  const contextError = selectedMonths > 1 && expandedTransactions.isError;

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

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!chatOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chatOpen]);

  const submit = async (): Promise<void> => {
    const value = text.trim();
    if (!value) return;
    if (!aiOnline) {
      showFeedback("warn", "AI endpoint unreachable - check Settings > AI endpoint");
      return;
    }
    if (contextLoading) {
      showFeedback("info", "Loading selected month context...");
      return;
    }
    if (contextError) {
      showFeedback("error", "Couldn't load transaction context. Try a smaller range.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: value,
    };
    const thinkingId = `a-thinking-${Date.now()}`;
    setStatus("thinking");
    setFeedback(null);
    setText("");
    setChatOpen(true);
    setMessages((curr) => [
      ...curr,
      userMessage,
      {
        id: thinkingId,
        role: "assistant",
        text: "thinking...",
        state: "thinking",
      },
    ]);

    try {
      const res = await askFinanceQuestionInBrowser(llmSettings, {
        question: value,
        months: selectedMonths,
        from: range.from,
        to: range.to,
        transactions: contextTransactions,
        categories,
        accounts,
        currency,
        limited: contextLimited,
        onThinkingDelta: (delta) => {
          setMessages((curr) =>
            curr.map((m) =>
              m.id === thinkingId
                ? {
                    ...m,
                    text:
                      m.state === "thinking" && m.text === "thinking..."
                        ? delta
                        : `${m.text}${delta}`,
                  }
                : m,
            ),
          );
        },
      });
      if (res.offline) {
        setStatus("idle");
        showFeedback("warn", "AI endpoint unreachable - check Settings > AI endpoint");
        setMessages((curr) =>
          curr.map((m) =>
            m.id === thinkingId
              ? {
                  ...m,
                  text: "AI endpoint unreachable. Check Settings > AI endpoint and try again.",
                  state: undefined,
                }
              : m,
          ),
        );
        return;
      }
      setMessages((curr) =>
        curr.map((m) =>
          m.id === thinkingId
            ? {
                ...m,
                text: res.answer ?? "I couldn't answer from the selected transaction context.",
                state: undefined,
              }
            : m,
        ),
      );
      setStatus("idle");
      if (contextLimited)
        showFeedback("info", "Context limited to the latest 500 transactions.", 3500);
    } catch (err) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "unexpected error";
      showFeedback("error", `Finance chat failed: ${msg}`);
      setMessages((curr) =>
        curr.map((m) =>
          m.id === thinkingId
            ? {
                ...m,
                text: `Finance chat failed: ${msg}`,
                state: undefined,
              }
            : m,
        ),
      );
    }
  };

  const placeholder = aiOnline ? "Ask about this month..." : "ai offline - configure settings";

  const feedbackColor =
    feedback?.kind === "error"
      ? "var(--neg)"
      : feedback?.kind === "warn"
        ? "var(--neg)"
        : feedback?.kind === "ok"
          ? "var(--pos)"
          : "var(--fgMuted)";

  const monthSelector = (
    <div className="flex items-center gap-1 overflow-x-auto">
      {MONTH_OPTIONS.map((m) => {
        const selected = selectedMonths === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => {
              setSelectedMonths(m);
              setFeedback(null);
            }}
            className="shrink-0 rounded-full px-2.5 py-1 font-mono uppercase"
            style={{
              border: `1px solid ${selected ? "var(--aiLine)" : "var(--line)"}`,
              background: selected ? "var(--aiTint)" : "var(--surface)",
              color: selected ? "var(--fg)" : "var(--fgMuted)",
              fontSize: 10,
              letterSpacing: "0.08em",
            }}
            aria-pressed={selected}
          >
            {m}mo
          </button>
        );
      })}
      {contextLimited ? (
        <span className="ml-1 shrink-0 font-mono uppercase text-fg-dim" style={{ fontSize: 9 }}>
          latest 500
        </span>
      ) : null}
    </div>
  );

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5"
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
        disabled={!aiOnline || status === "thinking" || contextLoading}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="flex-1 bg-transparent font-mono outline-none disabled:opacity-60"
        style={{
          fontSize: 13,
          color: "var(--fg)",
        }}
        aria-label="Ask about transaction data"
      />
      <button
        type="submit"
        disabled={!aiOnline || status === "thinking" || contextLoading || text.trim() === ""}
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
  );

  return (
    <>
      {chatOpen ? (
        <div
          className="fixed inset-0 z-40 flex flex-col"
          style={{ background: "var(--bg)", color: "var(--fg)" }}
          role="dialog"
          aria-modal="true"
          aria-label="AI finance chat"
        >
          <header
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <div>
              <div className="font-display text-[16px] font-medium">Finance chat</div>
              <div className="mt-0.5 font-mono uppercase text-fg-dim" style={{ fontSize: 10 }}>
                {selectedMonths}mo context · {contextTransactions.length} transactions
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="inline-flex items-center justify-center rounded-full font-mono"
              style={{
                width: 36,
                height: 36,
                border: "1px solid var(--lineStrong)",
                color: "var(--fg)",
                background: "var(--surface)",
                fontSize: 18,
                lineHeight: 1,
              }}
              aria-label="Close finance chat"
            >
              ×
            </button>
          </header>
          <div className="shrink-0 px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
            {monthSelector}
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === "user" ? "ml-10 text-right" : "mr-10"}
                  style={{
                    color: m.role === "user" ? "var(--fg)" : "var(--fg)",
                  }}
                >
                  <div
                    className="mb-0.5 font-mono uppercase"
                    style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--fgDim)" }}
                  >
                    {m.state === "thinking" ? "thinking" : m.role === "user" ? "you" : "ai"}
                  </div>
                  <div
                    className="inline-block max-w-full rounded-lg px-3 py-2 text-left"
                    style={{
                      background: m.role === "user" ? "var(--surface)" : "var(--aiTint)",
                      border: `1px solid ${m.role === "user" ? "var(--line)" : "var(--aiLine)"}`,
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                  >
                    {m.state === "thinking" ? (
                      <span className="inline-flex items-start gap-2">
                        <span
                          aria-hidden
                          style={{
                            width: 9,
                            height: 9,
                            marginTop: 6,
                            borderRadius: "50%",
                            background: "var(--aiLine)",
                            animation: "cc_thinking_pulse 0.9s ease-in-out infinite",
                            flexShrink: 0,
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            color: m.text === "thinking..." ? "var(--fgMuted)" : "var(--fg)",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {m.text}
                        </span>
                      </span>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="shrink-0 px-4 pb-5 pt-3"
            style={{
              background: "linear-gradient(to top, var(--bg) 85%, transparent)",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div className="mx-auto w-full max-w-2xl">{composer}</div>
          </div>
        </div>
      ) : null}

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
          <div className="mb-2">{monthSelector}</div>
          <div className="mb-3">{composer}</div>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="mb-3 w-full rounded-lg px-3 py-2 text-left"
              style={{
                background: "var(--aiTint)",
                border: "1px dashed var(--aiLine)",
                color: "var(--fg)",
                fontSize: 12,
              }}
            >
              <span className="font-mono uppercase tracking-wider text-fg-dim">open chat</span>
              <span className="ml-2 text-fg-muted">{messages.length} messages</span>
            </button>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <PlusMinusButton
              kind="minus"
              size={64}
              onClick={() => router.push("/add?kind=expense")}
            />
            <div
              className="flex flex-1 items-center justify-center gap-1.5 font-mono uppercase"
              style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.14em" }}
            >
              {status === "thinking" ? (
                <>
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      border: "1.5px solid var(--lineStrong)",
                      borderTopColor: "var(--accent)",
                      animation: "cc_dock_spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  thinking…
                </>
              ) : contextLoading ? (
                "loading context"
              ) : (
                "tap to add"
              )}
            </div>
            <style>{`
            @keyframes cc_dock_spin { to { transform: rotate(360deg); } }
            @keyframes cc_thinking_pulse {
              0%, 100% { opacity: 0.35; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
            <PlusMinusButton
              kind="plus"
              size={72}
              onClick={() => router.push("/add?kind=income")}
            />
          </div>
        </div>
      </div>
    </>
  );
}
