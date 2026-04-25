"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [flagged, setFlagged] = useState<boolean>(txn.flagged);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllCats, setShowAllCats] = useState(false);

  const update = useUpdateTransaction();
  const del = useDeleteTransaction();

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    amountRef.current?.focus();
    amountRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = sheetRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filteredCats = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);
  const CAT_COLLAPSE_LIMIT = 8;
  const visibleCats = useMemo(() => {
    if (showAllCats || filteredCats.length <= CAT_COLLAPSE_LIMIT) return filteredCats;
    const head = filteredCats.slice(0, CAT_COLLAPSE_LIMIT);
    const selected = catId ? filteredCats.find((c) => c.id === catId) : null;
    if (selected && !head.some((c) => c.id === selected.id)) {
      return [...head.slice(0, CAT_COLLAPSE_LIMIT - 1), selected];
    }
    return head;
  }, [filteredCats, showAllCats, catId]);
  const symbol = CURRENCIES[currency].symbol;
  const amountNum = Number(amountStr) || 0;
  const amountMinor = toMinor(amountNum, currency);
  const occurredDate = occurredAtLocal ? new Date(occurredAtLocal) : null;
  const occurredValid = occurredDate !== null && !Number.isNaN(occurredDate.getTime());
  const canSave = amountMinor > 0 && !!catId && !!acctId && occurredValid && !update.isPending;

  const save = async (): Promise<void> => {
    setError(null);
    if (!occurredValid || !occurredDate) {
      setError("Invalid date");
      return;
    }
    try {
      await update.mutateAsync({
        id: txn.id,
        patch: {
          accountId: acctId,
          categoryId: catId,
          amountMinor,
          note,
          occurredAt: occurredDate.toISOString(),
          kind,
          flagged,
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
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit transaction"
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
                ref={amountRef}
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
            <div className="mb-1 flex items-center justify-between">
              <span className="txt-mono-label">category</span>
              {filteredCats.length > CAT_COLLAPSE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setShowAllCats((v) => !v)}
                  className="font-mono text-[10px] uppercase tracking-wider text-fg-dim"
                >
                  {showAllCats ? "show less" : `show all (${filteredCats.length})`}
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleCats.map((c) => {
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
                    style={{ maxWidth: "100%" }}
                    title={c.label}
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c.colorHex }}
                    />
                    <span className="truncate" style={{ maxWidth: 180 }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flag */}
          <div>
            <button
              type="button"
              onClick={() => setFlagged((v) => !v)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-[13px]"
              style={{
                background: flagged ? "var(--surface2)" : "transparent",
                borderColor: flagged ? "var(--neg)" : "var(--line)",
                color: flagged ? "var(--neg)" : "var(--fgMuted)",
              }}
              aria-pressed={flagged}
            >
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 3v18M5 4h11l-2 4 2 4H5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={flagged ? "currentColor" : "none"}
                  />
                </svg>
                {flagged ? "Flagged" : "Flag for review"}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {flagged ? "on" : "off"}
              </span>
            </button>
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
