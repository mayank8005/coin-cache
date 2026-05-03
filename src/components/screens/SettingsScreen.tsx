"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ChipRep, ChipStyle, CurrencyCode, PaletteId, VizStyle } from "@/types/design";
import { PALETTES } from "@/constants/palettes";
import { CURRENCY_CODES } from "@/constants/currencies";
import { useUpdateSettings } from "@/hooks/api";
import { cn } from "@/utils/cn";
import {
  DEFAULT_BROWSER_LLM_BASE_URL,
  DEFAULT_BROWSER_LLM_MODEL,
  listBrowserLlmModels,
} from "@/lib/llm/browser-client";

interface Props {
  displayName: string;
  paletteId: PaletteId;
  vizStyle: VizStyle;
  chipStyle: ChipStyle;
  chipRep: ChipRep;
  currency: CurrencyCode;
  llmBaseUrl: string | null;
  llmApiKey: string | null;
  llmModel: string | null;
}

export function SettingsScreen(initial: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [paletteId, setPaletteId] = useState<PaletteId>(initial.paletteId);
  const [vizStyle, setVizStyle] = useState<VizStyle>(initial.vizStyle);
  const [chipStyle, setChipStyle] = useState<ChipStyle>(initial.chipStyle);
  const [chipRep, setChipRep] = useState<ChipRep>(initial.chipRep);
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency);
  const [llmBaseUrl, setLlmBaseUrl] = useState(initial.llmBaseUrl ?? DEFAULT_BROWSER_LLM_BASE_URL);
  const [llmApiKey, setLlmApiKey] = useState(initial.llmApiKey ?? "");
  const [llmModel, setLlmModel] = useState(initial.llmModel ?? DEFAULT_BROWSER_LLM_MODEL);
  const [status, setStatus] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [modelsStatus, setModelsStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const update = useUpdateSettings();
  const lastFetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const url = llmBaseUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setModels([]);
      setModelsStatus("idle");
      lastFetchedKeyRef.current = null;
      return;
    }
    const apiKey = llmApiKey.trim() === "" ? null : llmApiKey.trim();
    const fetchKey = `${url}::${apiKey ?? ""}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;
    setModelsStatus("loading");
    let cancelled = false;
    listBrowserLlmModels({
      llmBaseUrl: url,
      llmApiKey: apiKey,
      llmModel,
    })
      .then((res) => {
        if (cancelled) return;
        setModels(res);
        setModelsStatus(res.length > 0 ? "ok" : "fail");
        if (res.length > 0 && llmModel.trim() === "") {
          setLlmModel(res[0] ?? "");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setModels([]);
        setModelsStatus("fail");
      });
    return () => {
      cancelled = true;
    };
  }, [llmApiKey, llmBaseUrl, llmModel]);

  const save = async (): Promise<void> => {
    setStatus(null);
    try {
      await update.mutateAsync({
        displayName,
        paletteId,
        vizStyle,
        chipStyle,
        chipRep,
        currency,
        llmBaseUrl: llmBaseUrl.trim() === "" ? DEFAULT_BROWSER_LLM_BASE_URL : llmBaseUrl.trim(),
        llmApiKey: llmApiKey.trim() === "" ? null : llmApiKey.trim(),
        llmModel: llmModel.trim() === "" ? DEFAULT_BROWSER_LLM_MODEL : llmModel.trim(),
      });
      setStatus("saved");
      await queryClient.invalidateQueries();
      router.refresh();
    } catch {
      setStatus("error");
    }
  };

  const activePalette = PALETTES[paletteId];
  const paletteOptions = Object.values(PALETTES);

  return (
    <div className="min-h-dvh p-4" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider"
          style={{ color: "var(--fgMuted)" }}
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
        className="card-sunk mb-5 w-full px-3 py-3 text-[14px] outline-none"
      />

      <div className="mb-2 txt-mono-label">theme</div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full"
          style={{ border: "1px solid var(--lineStrong)" }}
        >
          <span className="h-full w-1/2" style={{ background: activePalette.bg }} />
          <span className="h-full w-1/2" style={{ background: activePalette.accent }} />
        </span>
        <select
          value={paletteId}
          onChange={(e) => setPaletteId(e.target.value as PaletteId)}
          className="card-sunk w-full px-3 py-3 text-[14px] outline-none"
          style={{
            appearance: "none",
            background:
              "var(--surface2) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='currentColor' fill='none' stroke-width='1.5'/></svg>\") right 12px center / 10px no-repeat",
          }}
        >
          {paletteOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-1">
        <span className="h-1.5 rounded-full" style={{ background: activePalette.bg }} />
        <span className="h-1.5 rounded-full" style={{ background: activePalette.surface2 }} />
        <span className="h-1.5 rounded-full" style={{ background: activePalette.accent }} />
      </div>

      <div className="mb-2 txt-mono-label">chart style</div>
      <div className="mb-5 flex gap-2">
        {(["rings", "pie"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVizStyle(v)}
            className={cn(
              "flex-1 rounded-pill py-2 font-mono text-[11px] uppercase tracking-wider transition-colors duration-med",
            )}
            style={
              vizStyle === v
                ? { background: "var(--fg)", color: "var(--bg)", border: "1px solid var(--fg)" }
                : {
                    background: "transparent",
                    color: "var(--fgMuted)",
                    border: "1px solid var(--lineStrong)",
                  }
            }
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">chip style</div>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {(["rings", "pill", "block", "mono"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setChipStyle(v)}
            className="rounded-pill py-2 font-mono text-[11px] uppercase tracking-wider transition-colors duration-med"
            style={
              chipStyle === v
                ? { background: "var(--fg)", color: "var(--bg)", border: "1px solid var(--fg)" }
                : {
                    background: "transparent",
                    color: "var(--fgMuted)",
                    border: "1px solid var(--lineStrong)",
                  }
            }
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">category glyph</div>
      <div className="mb-5 flex gap-2">
        {(["mono", "icon"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setChipRep(v)}
            className="flex-1 rounded-pill py-2 font-mono text-[11px] uppercase tracking-wider transition-colors duration-med"
            style={
              chipRep === v
                ? { background: "var(--fg)", color: "var(--bg)", border: "1px solid var(--fg)" }
                : {
                    background: "transparent",
                    color: "var(--fgMuted)",
                    border: "1px solid var(--lineStrong)",
                  }
            }
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
            className="flex-1 rounded-pill py-2 font-mono text-[11px] uppercase tracking-wider transition-colors duration-med"
            style={
              currency === c
                ? { background: "var(--fg)", color: "var(--bg)", border: "1px solid var(--fg)" }
                : {
                    background: "transparent",
                    color: "var(--fgMuted)",
                    border: "1px solid var(--lineStrong)",
                  }
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-2 txt-mono-label">ai endpoint (openai-compatible)</div>
      <input
        type="url"
        value={llmBaseUrl}
        onChange={(e) => setLlmBaseUrl(e.target.value)}
        placeholder={DEFAULT_BROWSER_LLM_BASE_URL}
        spellCheck={false}
        autoComplete="off"
        className="card-sunk mb-3 w-full px-3 py-3 font-mono text-[12px] outline-none"
      />
      <div className="mb-2 flex items-center justify-between">
        <span className="txt-mono-label">model</span>
        <span className="font-mono text-[10px]" style={{ color: "var(--fgDim)" }}>
          {modelsStatus === "loading"
            ? "loading…"
            : modelsStatus === "ok"
              ? `${models.length} available`
              : modelsStatus === "fail" && llmBaseUrl.trim() !== ""
                ? "endpoint unreachable"
                : ""}
        </span>
      </div>
      {models.length > 0 ? (
        <select
          value={models.includes(llmModel) ? llmModel : ""}
          onChange={(e) => setLlmModel(e.target.value)}
          className="card-sunk mb-3 w-full px-3 py-3 font-mono text-[12px] outline-none"
          style={{
            appearance: "none",
            background:
              "var(--surface2) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='currentColor' fill='none' stroke-width='1.5'/></svg>\") right 12px center / 10px no-repeat",
          }}
        >
          {!models.includes(llmModel) ? <option value="">— pick a model —</option> : null}
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={llmModel}
          onChange={(e) => setLlmModel(e.target.value)}
          placeholder={DEFAULT_BROWSER_LLM_MODEL}
          spellCheck={false}
          autoComplete="off"
          className="card-sunk mb-3 w-full px-3 py-3 font-mono text-[12px] outline-none"
        />
      )}
      <div className="mb-2 txt-mono-label">api key (optional)</div>
      <input
        type="password"
        value={llmApiKey}
        onChange={(e) => setLlmApiKey(e.target.value)}
        placeholder="sk-… (leave blank for local)"
        spellCheck={false}
        autoComplete="off"
        className="card-sunk mb-2 w-full px-3 py-3 font-mono text-[12px] outline-none"
      />
      <p className="mb-6 font-mono text-[10px]" style={{ color: "var(--fgDim)" }}>
        Works with Ollama, LM Studio, OpenRouter, or any /v1-compatible endpoint. Blank fields use
        the LAN Ollama default.
      </p>

      <button
        type="button"
        onClick={save}
        disabled={update.isPending}
        className="w-full rounded-md py-3 text-[14px] font-medium disabled:opacity-50"
        style={{ background: "var(--accent)", color: "var(--accentInk)" }}
      >
        {update.isPending ? "Saving…" : "Save"}
      </button>
      {status === "error" ? (
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--neg)" }}>
          Could not save — try again
        </p>
      ) : null}

      <div className="mb-2 mt-8 txt-mono-label">manage</div>
      <div className="flex flex-col gap-2">
        <Link
          href="/categories/new"
          className="flex items-center justify-between rounded-md px-4 py-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <span className="font-display text-[14px] font-medium">New category</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--fgMuted)" }}>
            →
          </span>
        </Link>
        <Link
          href="/accounts/new"
          className="flex items-center justify-between rounded-md px-4 py-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <span className="font-display text-[14px] font-medium">New account</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--fgMuted)" }}>
            →
          </span>
        </Link>
        <a
          href="/import"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-md px-4 py-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <span className="font-display text-[14px] font-medium">Import CSV</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--fgMuted)" }}>
            ↗
          </span>
        </a>
      </div>
    </div>
  );
}
