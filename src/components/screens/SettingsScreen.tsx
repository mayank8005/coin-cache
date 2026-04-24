"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChipStyle, CurrencyCode, PaletteId, VizStyle } from "@/types/design";
import { PALETTES } from "@/constants/palettes";
import { CURRENCY_CODES } from "@/constants/currencies";
import { useUpdateSettings } from "@/hooks/api";
import { cn } from "@/utils/cn";

interface Props {
  displayName: string;
  paletteId: PaletteId;
  vizStyle: VizStyle;
  chipStyle: ChipStyle;
  currency: CurrencyCode;
}

export function SettingsScreen(initial: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [paletteId, setPaletteId] = useState<PaletteId>(initial.paletteId);
  const [vizStyle, setVizStyle] = useState<VizStyle>(initial.vizStyle);
  const [chipStyle, setChipStyle] = useState<ChipStyle>(initial.chipStyle);
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency);
  const update = useUpdateSettings();

  const save = async (): Promise<void> => {
    await update.mutateAsync({ displayName, paletteId, vizStyle, chipStyle, currency });
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
        <h1 className="font-display text-[16px] font-medium">Settings</h1>
        <span className="w-12" />
      </header>

      <div className="mb-2 txt-mono-label">display name</div>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="card-sunk mb-4 w-full px-3 py-3 text-[14px] outline-none"
      />

      <div className="mb-2 txt-mono-label">theme</div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {Object.values(PALETTES).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPaletteId(p.id)}
            className={cn(
              "rounded-md border p-2 text-left transition-colors duration-med",
              paletteId === p.id ? "border-fg" : "border-line-strong",
            )}
          >
            <div className="flex gap-1 mb-1">
              <span className="h-4 w-4 rounded-full" style={{ background: p.bg }} />
              <span className="h-4 w-4 rounded-full" style={{ background: p.surface }} />
              <span className="h-4 w-4 rounded-full" style={{ background: p.accent }} />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
              {p.name}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">chart style</div>
      <div className="mb-4 flex gap-2">
        {(["rings", "pie"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVizStyle(v)}
            className={cn(
              "flex-1 rounded-pill border py-2 text-[11px] font-mono uppercase tracking-wider transition-colors duration-med",
              vizStyle === v ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-fg-muted",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">chip style</div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {(["rings", "pill", "block", "mono"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setChipStyle(v)}
            className={cn(
              "rounded-pill border py-2 text-[11px] font-mono uppercase tracking-wider transition-colors duration-med",
              chipStyle === v ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-fg-muted",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">currency</div>
      <div className="mb-6 flex gap-2">
        {CURRENCY_CODES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={cn(
              "flex-1 rounded-pill border py-2 text-[11px] font-mono uppercase tracking-wider transition-colors duration-med",
              currency === c ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-fg-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={update.isPending}
        className="w-full rounded-md bg-accent py-3 text-[14px] font-medium text-accent-ink disabled:opacity-50"
      >
        {update.isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
