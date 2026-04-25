"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDto, CategoryDto } from "@/lib/dto";
import type { ChipRep, ChipStyle, CurrencyCode, TxnKind } from "@/types/design";
import { CategoryChip } from "@/components/primitives/CategoryChip";
import { CURRENCIES } from "@/constants/currencies";
import { toMinor } from "@/utils/format";
import { useCreateTransaction, useNlParse } from "@/hooks/api";
import { cn } from "@/utils/cn";

interface Props {
  kind: TxnKind;
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  chipStyle: ChipStyle;
  chipRep: ChipRep;
  llmConfigured: boolean;
}

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;

export function AddScreen({ kind, categories, accounts, currency, chipStyle, chipRep, llmConfigured }: Props) {
  const router = useRouter();
  const filteredCats = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);
  const [amountStr, setAmountStr] = useState<string>("");
  const [note, setNote] = useState("");
  const [catId, setCatId] = useState<string | null>(filteredCats[0]?.id ?? null);
  const [acctId, setAcctId] = useState<string | null>(accounts[0]?.id ?? null);
  const [nlText, setNlText] = useState("");
  const [showNl, setShowNl] = useState(false);
  const [aiFlag, setAiFlag] = useState<{ conf: number; source: "nl" } | null>(null);

  const create = useCreateTransaction();
  const parseNl = useNlParse();

  const amountNum = useMemo(() => Number(amountStr) || 0, [amountStr]);
  const amountMinor = useMemo(() => toMinor(amountNum, currency), [amountNum, currency]);
  const canSubmit = amountMinor > 0 && catId && acctId && !create.isPending;
  const symbol = CURRENCIES[currency].symbol;

  const pressKey = (k: (typeof NUMPAD_KEYS)[number]): void => {
    if (k === "⌫") {
      setAmountStr((s) => s.slice(0, -1));
      return;
    }
    if (k === ".") {
      if (amountStr.includes(".")) return;
      setAmountStr((s) => (s === "" ? "0." : s + "."));
      return;
    }
    setAmountStr((s) => {
      if (s.includes(".")) {
        const [, dec = ""] = s.split(".");
        if (dec.length >= 2) return s;
      }
      if (s === "0") return k;
      return s + k;
    });
  };

  const submit = async (): Promise<void> => {
    if (!canSubmit || !catId || !acctId) return;
    await create.mutateAsync({
      accountId: acctId,
      categoryId: catId,
      amountMinor,
      note,
      occurredAt: new Date().toISOString(),
      kind,
      aiCategorized: aiFlag !== null,
      aiConfidence: aiFlag?.conf ?? null,
    });
    router.push("/");
    router.refresh();
  };

  const runNl = async (): Promise<void> => {
    if (!nlText.trim()) return;
    const res = await parseNl.mutateAsync({ text: nlText });
    if (res.offline || !res.parsed) return;
    const p = res.parsed;
    setAmountStr(String(p.amountMinor / 100));
    setNote(p.note ?? nlText);
    if (p.categoryId && categories.some((c) => c.id === p.categoryId)) setCatId(p.categoryId);
    if (p.accountId && accounts.some((a) => a.id === p.accountId)) setAcctId(p.accountId);
    setAiFlag({ conf: p.confidence, source: "nl" });
    setShowNl(false);
  };

  const displayAmount = amountStr === "" ? "0" : amountStr;
  const signChar = kind === "expense" ? "\u2212" : "+";

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 pt-5 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider text-fg-muted"
        >
          ← cancel
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-dim">
          {kind === "expense" ? "Expense" : "Income"}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-pill bg-accent px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
        >
          {create.isPending ? "Saving…" : "Save"}
        </button>
      </header>

      {/* Amount hero */}
      <div className="flex flex-col items-center gap-3 px-5 pt-4 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-dim">
          {kind === "expense" ? "Spend" : "Receive"}
        </span>
        <div
          className="font-display font-medium tabular-nums"
          style={{
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: kind === "income" ? "var(--pos)" : "var(--fg)",
          }}
        >
          {signChar}
          {symbol}
          {displayAmount}
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="add a note…"
          className="w-[70%] min-w-0 rounded-pill border border-line bg-transparent px-4 py-1.5 text-center font-mono text-[12px] outline-none"
        />
      </div>

      {/* Accounts */}
      <div className="px-4 pt-1">
        <div className="mb-1.5 txt-mono-label">account</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {accounts.map((a) => {
            const sel = acctId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAcctId(a.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-pill border px-3 py-1.5 text-[12px] font-medium transition-colors duration-med",
                  sel ? "border-transparent bg-fg text-bg" : "border-line-strong text-fg-muted",
                )}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: a.colorHex }}
                />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* NL input (collapsible) */}
      {llmConfigured ? (
        showNl ? (
          <div className="mx-4 mt-2 flex items-center gap-2 rounded-pill border border-line-strong px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase text-fg-dim">··</span>
            <input
              type="text"
              autoFocus
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runNl();
              }}
              placeholder='e.g. "thai takeaway 22"'
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={runNl}
              disabled={parseNl.isPending}
              className="font-mono text-[10px] uppercase tracking-wider text-fg-muted disabled:opacity-50"
            >
              {parseNl.isPending ? "…" : "go"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNl(true)}
            className="mx-4 mt-2 self-start font-mono text-[10px] uppercase tracking-wider text-fg-dim"
          >
            ·· ask ai
          </button>
        )
      ) : null}

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
        <div className="mb-2 txt-mono-label">category</div>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3">
          {filteredCats.map((c) => (
            <div key={c.id} className="flex justify-center">
              <CategoryChip
                cat={c}
                selected={catId === c.id}
                onClick={() => {
                  setCatId(c.id);
                  setAiFlag(null);
                }}
                style={chipStyle}
                representation={chipRep}
                size={54}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Numpad */}
      <div
        className="grid w-full grid-cols-3 gap-px"
        style={{ background: "var(--line)", borderTop: "1px solid var(--line)" }}
      >
        {NUMPAD_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => pressKey(k)}
            className="font-mono font-medium tabular-nums"
            style={{
              height: 52,
              background: "var(--bg)",
              color: "var(--fg)",
              fontSize: 22,
              letterSpacing: "-0.02em",
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
