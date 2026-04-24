"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountDto, CategoryDto } from "@/lib/dto";
import type { ChipStyle, CurrencyCode, TxnKind } from "@/types/design";
import { CategoryChip } from "@/components/primitives/CategoryChip";
import { formatAmount, toMinor } from "@/utils/format";
import { useCreateTransaction, useNlParse } from "@/hooks/api";
import { cn } from "@/utils/cn";

interface Props {
  kind: TxnKind;
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  chipStyle: ChipStyle;
  llmConfigured: boolean;
}

export function AddScreen({ kind, categories, accounts, currency, chipStyle, llmConfigured }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [catId, setCatId] = useState<string | null>(categories[0]?.id ?? null);
  const [acctId, setAcctId] = useState<string | null>(accounts[0]?.id ?? null);
  const [nlText, setNlText] = useState("");
  const [aiFlag, setAiFlag] = useState<{ conf: number; source: "nl" } | null>(null);

  const create = useCreateTransaction();
  const parseNl = useNlParse();

  const amountMinor = useMemo(() => toMinor(amount, currency), [amount, currency]);
  const canSubmit = amountMinor > 0 && catId && acctId && !create.isPending;

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
    setAmount(p.amountMinor / 100);
    setNote(p.note ?? nlText);
    if (p.categoryId && categories.some((c) => c.id === p.categoryId)) setCatId(p.categoryId);
    if (p.accountId && accounts.some((a) => a.id === p.accountId)) setAcctId(p.accountId);
    setAiFlag({ conf: p.confidence, source: "nl" });
  };

  return (
    <div className="min-h-dvh p-4">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider text-fg-muted"
        >
          ← back
        </button>
        <h1 className="font-display text-[16px] font-medium">
          {kind === "expense" ? "Spend" : "Earn"}{" "}
          <span className="font-mono text-[14px] text-fg-muted">
            {formatAmount(amountMinor, currency)}
          </span>
        </h1>
        <span className="w-12" />
      </header>

      {/* Amount */}
      <div className="card mb-3 flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => setAmount((a) => Math.max(0, a - 1))}
          className="h-9 w-9 rounded-pill border border-line-strong text-[18px]"
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          placeholder="0"
          className="flex-1 bg-transparent text-center font-mono font-medium tabular-nums outline-none"
          style={{ fontSize: 42, letterSpacing: "-0.04em" }}
        />
        <button
          type="button"
          onClick={() => setAmount((a) => a + 1)}
          className="h-9 w-9 rounded-pill border border-line-strong text-[18px]"
        >
          +
        </button>
      </div>

      {/* Note */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={kind === "expense" ? "Lunch with Sara" : "Paycheck"}
        className="card-sunk mb-4 w-full px-3 py-3 text-[14px] outline-none"
      />

      {/* Categories */}
      <div className="mb-2 txt-mono-label">category</div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            cat={c}
            selected={catId === c.id}
            onClick={() => {
              setCatId(c.id);
              setAiFlag(null);
            }}
            style={chipStyle}
            size={60}
          />
        ))}
      </div>

      {/* Accounts */}
      <div className="mb-2 txt-mono-label">account</div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAcctId(a.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-pill border px-3 py-1.5 text-[12px] font-medium transition-colors duration-med",
              acctId === a.id ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-fg",
            )}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: a.colorHex }}
            />
            {a.label}
          </button>
        ))}
      </div>

      {llmConfigured ? (
        <div className="card-sunk mb-4 flex items-center gap-2 px-3 py-2">
          <span className="font-mono text-[10px] uppercase text-fg-dim">··</span>
          <input
            type="text"
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runNl();
            }}
            placeholder='Try: "thai takeaway 22 on apr 18"'
            className="flex-1 bg-transparent text-[12px] outline-none"
          />
          <button
            type="button"
            onClick={runNl}
            disabled={parseNl.isPending}
            className="font-mono text-[10px] uppercase tracking-wider text-fg-muted disabled:opacity-50"
          >
            {parseNl.isPending ? "parsing…" : "⌘K"}
          </button>
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-md border border-line-strong py-3 text-[14px] font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 rounded-md bg-accent py-3 text-[14px] font-medium text-accent-ink disabled:opacity-50"
        >
          {create.isPending ? "Saving…" : kind === "expense" ? "Spend" : "Earn"}
        </button>
      </div>
    </div>
  );
}
