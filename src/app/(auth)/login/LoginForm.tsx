"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  displayName: string;
  initials: string;
  color: string;
  role: string;
}

interface Props {
  next?: string;
  error?: string;
}

export function LoginForm({ next, error }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [shake, setShake] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [hint, setHint] = useState<string | null>(error ? "try again" : null);
  const attemptingRef = useRef(false);

  const PIN_MIN = 4;
  const PIN_MAX = 10;

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/users");
      const json = (await r.json()) as { users?: Member[] };
      const list = json.users ?? [];
      setMembers(list);
      if (list[0]) setSelectedId(list[0].id);
    })();
  }, []);

  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? null,
    [members, selectedId],
  );

  const attempt = async (candidate: string): Promise<void> => {
    if (!selectedId || attemptingRef.current) return;
    if (candidate.length < PIN_MIN || candidate.length > PIN_MAX) return;
    attemptingRef.current = true;
    setPending(true);
    const res = await signIn("credentials", {
      userId: selectedId,
      pin: candidate,
      redirect: false,
    });
    if (!res || res.error) {
      setShake(true);
      setHint("try again");
      setTimeout(() => {
        setShake(false);
        setPin("");
        setPending(false);
        attemptingRef.current = false;
      }, 400);
      return;
    }
    setUnlocked(true);
    setHint("·· unlocking");
    setTimeout(() => {
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    }, 240);
  };

  useEffect(() => {
    if (pin.length !== PIN_MAX) return;
    void attempt(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const addDigit = (d: string): void => {
    if (pin.length >= PIN_MAX || unlocked || pending) return;
    setPin((s) => s + d);
    setHint(null);
  };
  const delDigit = (): void => {
    if (unlocked) return;
    setPin((s) => s.slice(0, -1));
  };
  const submitPin = (): void => {
    if (pin.length < PIN_MIN || pin.length > PIN_MAX || unlocked || pending) return;
    void attempt(pin);
  };

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        addDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        delDigit();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitPin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, pin, unlocked, pending]);

  const greeting = unlocked
    ? "·· unlocking"
    : hint ?? (pin.length === PIN_MAX ? "checking" : pin.length >= PIN_MIN ? "tap → to unlock" : "enter pin");

  const dotCount = Math.min(PIN_MAX, Math.max(PIN_MIN, pin.length));
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const filled = i < pin.length;
    return (
      <div
        key={i}
        className="transition-all"
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: filled ? (unlocked ? "var(--pos)" : "var(--fg)") : "transparent",
          border: `1.5px solid ${filled ? (unlocked ? "var(--pos)" : "var(--fg)") : "var(--lineStrong)"}`,
          transitionDuration: "180ms",
          transitionTimingFunction: "cubic-bezier(.3,.7,.4,1)",
        }}
      />
    );
  });

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["→", "0", "⌫"],
  ] as const;
  const canSubmit = pin.length >= PIN_MIN && pin.length <= PIN_MAX && !unlocked && !pending;

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          opacity: 0.5,
        }}
      />

      {/* Status line */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[58px]">
        <div
          className="flex items-center gap-1.5 font-mono uppercase"
          style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.12em" }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--pos)",
              boxShadow: "0 0 6px var(--pos)",
            }}
          />
          coin.cache · local
        </div>
        <div
          className="font-mono uppercase"
          style={{ fontSize: 10, color: "var(--aiLine)", letterSpacing: "0.12em" }}
        >
          ·· ai ready
        </div>
      </div>

      {/* Logotype */}
      <div className="relative z-10 px-6 pb-1.5 pt-8">
        <div
          className="font-mono uppercase"
          style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.2em" }}
        >
          Household
        </div>
        <div className="mt-1 flex items-baseline gap-2.5">
          <div
            className="font-display"
            style={{
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--fg)",
            }}
          >
            Coin Cache
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "-0.02em" }}
          >
            ledger
          </div>
        </div>
      </div>

      {/* Member picker */}
      <div className="relative z-10 pb-2.5 pt-4">
        <div
          className="px-6 pb-2.5 font-mono uppercase"
          style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.14em" }}
        >
          Who&apos;s adding?
        </div>
        <div
          className="flex gap-2.5 overflow-x-auto px-5"
          style={{ scrollbarWidth: "none" }}
        >
          {members.length === 0 ? (
            <div
              className="px-2 py-2 font-mono"
              style={{ fontSize: 11, color: "var(--fgMuted)" }}
            >
              No users yet — admin must run <code>pnpm admin user:add</code>
            </div>
          ) : null}
          {members.map((m) => {
            const sel = selectedId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedId(m.id);
                  setPin("");
                  setUnlocked(false);
                  setHint(null);
                }}
                className="flex shrink-0 cursor-pointer flex-col items-center gap-2 px-1.5 pb-3 pt-2.5 transition-all"
                style={{
                  width: 72,
                  background: sel ? "var(--surface)" : "transparent",
                  border: `1px solid ${sel ? "var(--lineStrong)" : "transparent"}`,
                  borderRadius: 14,
                }}
              >
                <div
                  className="flex items-center justify-center font-mono"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: m.color,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0B0B0C",
                    letterSpacing: "-0.02em",
                    transform: sel ? "scale(1.02)" : "scale(0.9)",
                    opacity: sel ? 1 : 0.6,
                    transition: "transform 180ms cubic-bezier(.3,.7,.4,1), opacity 180ms",
                    boxShadow: sel ? `0 6px 20px -6px ${m.color}aa` : "none",
                  }}
                >
                  {m.initials}
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: sel ? "var(--fg)" : "var(--fgMuted)",
                  }}
                >
                  {m.displayName}
                </div>
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: 9,
                    color: "var(--fgDim)",
                    letterSpacing: "0.1em",
                    marginTop: -4,
                  }}
                >
                  {m.role}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PIN section */}
      <div className="relative z-10 flex flex-1 flex-col justify-end px-7 pb-6 pt-2.5">
        <div className="mb-4 text-center">
          <div
            className="font-mono uppercase"
            style={{ fontSize: 10, color: "var(--fgDim)", letterSpacing: "0.14em" }}
          >
            {greeting}
          </div>
          <div
            className="mt-1 font-display"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--fg)" }}
          >
            {selected ? `Hi, ${selected.displayName}` : "\u00A0"}
          </div>
        </div>

        <div
          className="mb-[22px] flex justify-center gap-4"
          style={{
            animation: shake ? "cc_shake 0.38s cubic-bezier(.3,.7,.4,1)" : "none",
          }}
        >
          {dots}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {keys.flat().map((k, i) => {
            if (k === "⌫") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={delDigit}
                  className="font-mono"
                  style={{
                    padding: "14px 0",
                    borderRadius: 14,
                    background: "transparent",
                    border: "1px solid var(--line)",
                    color: "var(--fgMuted)",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ⌫
                </button>
              );
            }
            if (k === "→") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={submitPin}
                  disabled={!canSubmit}
                  aria-label="Unlock"
                  className="font-mono transition-opacity"
                  style={{
                    padding: "14px 0",
                    borderRadius: 14,
                    background: canSubmit ? "var(--accent)" : "transparent",
                    border: `1px solid ${canSubmit ? "var(--accent)" : "var(--line)"}`,
                    color: canSubmit ? "var(--accentInk)" : "var(--fgDim)",
                    fontSize: 18,
                    lineHeight: 1,
                    opacity: canSubmit ? 1 : 0.5,
                  }}
                >
                  →
                </button>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => addDigit(k)}
                className="font-display transition-transform active:scale-95"
                style={{
                  padding: "14px 0",
                  borderRadius: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  color: "var(--fg)",
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {k}
              </button>
            );
          })}
        </div>

        <div
          className="mt-3.5 text-center font-mono uppercase"
          style={{ fontSize: 9, color: "var(--fgDim)", letterSpacing: "0.12em" }}
        >
          forgot pin?{" "}
          <span
            style={{
              color: "var(--fgMuted)",
              borderBottom: "1px dashed var(--line)",
            }}
          >
            admin reset
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cc_shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </main>
  );
}
