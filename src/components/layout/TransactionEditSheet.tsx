"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccountDto, CategoryDto, TransactionDto } from "@/lib/dto";
import type { CurrencyCode } from "@/types/design";
import { CURRENCIES } from "@/constants/currencies";
import { fromMinor, toMinor } from "@/utils/format";
import { useDeleteTransaction, useUpdateTransaction } from "@/hooks/api";
import { cn } from "@/utils/cn";

interface Props {
  txn: TransactionDto;
  categories: CategoryDto[];
  accounts: AccountDto[];
  currency: CurrencyCode;
  onClose: () => void;
}

const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function TransactionEditSheet({ txn, categories, accounts, currency, onClose }: Props) {
  const [kind, setKind] = useState<"expense" | "income">(txn.kind as "expense" | "income");
  const [amountStr, setAmountStr] = useState<string>(String(fromMinor(txn.amountMinor, currency)));
  const [note, setNote] = useState(txn.note);
  const [catId, setCatId] = useState(txn.categoryId);
  const [acctId, setAcctId] = useState(txn.accountId);
  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(toLocalInput(txn.occurredAt));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateTransaction();
  const del = useDeleteTransaction();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filteredCats = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);
  const symbol = CURRENCIES[currency].symbol;
  const amountNum = Number(amountStr) || 0;
  const amountMinor = toMinor(amountNum, currency);
  const canSave = amountMinor > 0 && !!catId && !!acctId && !update.isPending;

  const save = async (): Promise<void> => {
    setError(null);
    try {
      await update.mutateAsync({
        id: txn.id,
        patch: {
          accountId: acctId,
          categoryId: catId,
          amountMinor,
          note,
          occurredAt: new Date(occurredAtLocal).toISOString(),
          kind,
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save failed");
    }
  };

  const remove = async (): Promise<void> => {
    setError(null);
    try {
      await del.mutateAsync(txn.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-t-xl lg:rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--line)", maxHeight: "90dvh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-wider text-fg-muted"
          >
            ← cancel
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-dim">
            edit transaction
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-pill bg-accent px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="space-y-4 px-4 pb-4 pt-2">
          {/* Kind toggle */}
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  const first = categories.find((c) => c.kind === k);
                  if (first && !categories.find((c) => c.id === catId && c.kind === k)) {
                    setCatId(first.id);
                  }
                }}
                className={cn(
                  "flex-1 rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider",
                  kind === k ? "border-transparent bg-fg text-bg" : "border-line-strong text-fg-muted",
                )}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <div className="mb-1 txt-mono-label">amount</div>
            <div className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
              <span className="font-mono text-[14px] text-fg-muted">{symbol}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="flex-1 bg-transparent font-mono text-[15px] tabular-nums outline-none"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="mb-1 txt-mono-label">note</div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-[13px] outline-none"
            />
          </div>

          {/* Date / time */}
          <div>
            <div className="mb-1 txt-mono-label">when</div>
            <input
              type="datetime-local"
              value={occurredAtLocal}
              onChange={(e) => setOccurredAtLocal(e.target.value)}
              className="w-full rounded-md border border-line bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
            />
          </div>

          {/* Account */}
          <div>
            <div className="mb-1 txt-mono-label">account</div>
            <div className="flex flex-wrap gap-1.5">
              {accounts.map((a) => {
                const sel = acctId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAcctId(a.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-pill border px-3 py-1.5 text-[12px] font-medium",
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

          {/* Category */}
          <div>
            <div className="mb-1 txt-mono-label">category</div>
            <div className="flex flex-wrap gap-1.5">
              {filteredCats.map((c) => {
                const sel = catId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCatId(c.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-pill border px-3 py-1.5 text-[12px] font-medium",
                      sel ? "border-transparent bg-fg text-bg" : "border-line-strong text-fg-muted",
                    )}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: c.colorHex }}
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-md px-3 py-2 text-[12px]"
              style={{ background: "var(--surface2)", border: "1px solid var(--neg)", color: "var(--neg)" }}
            >
              {error}
            </div>
          ) : null}

          {/* Delete */}
          <div className="border-t border-line pt-3">
            {confirmDelete ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                  delete this transaction?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-pill border border-line-strong px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-fg-muted"
                  >
                    cancel
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={del.isPending}
                    className="rounded-pill px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider"
                    style={{ background: "var(--neg)", color: "var(--bg)" }}
                  >
                    {del.isPending ? "deleting…" : "delete"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{ color: "var(--neg)" }}
              >
                delete transaction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
