"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CurrencyCode, TxnKind } from "@/types/design";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_SWATCHES } from "@/constants/categories";
import { useCreateCategory } from "@/hooks/api";
import { monoCodeFrom, toMinor } from "@/utils/format";
import { cn } from "@/utils/cn";

interface Props {
  currency: CurrencyCode;
}

export function NewCategoryScreen({ currency }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [iconId, setIconId] = useState<string>(CATEGORY_ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(DEFAULT_CATEGORY_SWATCHES[0] ?? "#3F6B3A");
  const [kind, setKind] = useState<TxnKind>("expense");
  const [budget, setBudget] = useState<number>(0);
  const create = useCreateCategory();

  const submit = async (): Promise<void> => {
    if (!label.trim()) return;
    await create.mutateAsync({
      label: label.trim(),
      mono: monoCodeFrom(label),
      iconId,
      colorHex,
      kind,
      monthlyBudgetMinor: budget > 0 ? toMinor(budget, currency) : null,
    });
    router.back();
    router.refresh();
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
        <h1 className="font-display text-[16px] font-medium">New Category</h1>
        <span className="w-12" />
      </header>

      <div className="mb-2 txt-mono-label">kind</div>
      <div className="mb-4 flex gap-2">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "flex-1 rounded-pill border py-2 text-[12px] font-mono uppercase tracking-wider transition-colors duration-med",
              kind === k ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-fg-muted",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">label</div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Coffee"
        className="card-sunk mb-4 w-full px-3 py-3 text-[14px] outline-none"
      />

      <div className="mb-2 txt-mono-label">icon</div>
      <div className="mb-4 grid grid-cols-6 gap-2">
        {CATEGORY_ICONS.map((icn) => (
          <button
            key={icn}
            type="button"
            onClick={() => setIconId(icn)}
            className={cn(
              "rounded-md border py-2 font-mono text-[10px] uppercase tracking-wider transition-colors duration-med",
              iconId === icn ? "border-transparent bg-surface2 text-fg" : "border-line-strong text-fg-muted",
            )}
          >
            {icn}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">color</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {DEFAULT_CATEGORY_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColorHex(c)}
            aria-label={c}
            className={cn(
              "h-8 w-8 rounded-full border-2 transition-all duration-med",
              colorHex === c ? "border-fg scale-110" : "border-transparent",
            )}
            style={{ background: c }}
          />
        ))}
      </div>

      {kind === "expense" ? (
        <>
          <div className="mb-2 txt-mono-label">monthly budget (optional)</div>
          <input
            type="number"
            value={budget || ""}
            onChange={(e) => setBudget(Number(e.target.value) || 0)}
            placeholder="0"
            className="card-sunk mb-4 w-full px-3 py-3 font-mono text-[14px] outline-none"
          />
        </>
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
          disabled={!label.trim() || create.isPending}
          className="flex-1 rounded-md bg-accent py-3 text-[14px] font-medium text-accent-ink disabled:opacity-50"
        >
          {create.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
