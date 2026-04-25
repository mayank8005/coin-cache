"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_KINDS } from "@/constants/accounts";
import { DEFAULT_CATEGORY_SWATCHES } from "@/constants/categories";
import { useCreateAccount } from "@/hooks/api";
import { monoCodeFrom } from "@/utils/format";
import { cn } from "@/utils/cn";

export function NewAccountScreen() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<string>(ACCOUNT_KINDS[0]);
  const [last4, setLast4] = useState("");
  const [colorHex, setColorHex] = useState<string>(DEFAULT_CATEGORY_SWATCHES[0] ?? "#3F6B3A");
  const create = useCreateAccount();

  const submit = async (): Promise<void> => {
    if (!label.trim()) return;
    await create.mutateAsync({
      label: label.trim(),
      kind,
      mono: monoCodeFrom(label),
      last4: last4.length === 4 ? last4 : null,
      colorHex,
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
        <h1 className="font-display text-[16px] font-medium">New Account</h1>
        <span className="w-12" />
      </header>

      <div className="mb-2 txt-mono-label">kind</div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {ACCOUNT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "rounded-pill border py-2 text-[11px] font-mono uppercase tracking-wider transition-colors duration-med",
              kind === k ? "border-transparent bg-fg text-bg" : "border-line-strong text-fg-muted",
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
        placeholder="e.g. Savings"
        className="card-sunk mb-4 w-full px-3 py-3 text-[14px] outline-none"
      />

      <div className="mb-2 txt-mono-label">last 4 digits (optional, encrypted)</div>
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={last4}
        onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="1234"
        className="card-sunk mb-4 w-full px-3 py-3 font-mono text-[14px] outline-none"
      />

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
