"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CurrencyCode } from "@/types/design";
import { useResetTransactions } from "@/hooks/api";
import { formatAmount, toMinor } from "@/utils/format";

interface Props {
  currency: CurrencyCode;
}

interface ParsedRow {
  date: string;
  account: string;
  category: string;
  amount: number;
  description: string;
}

type DateFormat = "mdy" | "dmy" | "ymd";

interface RunStats {
  total: number;
  processed: number;
  created: number;
  errorCount: number;
  startedAt: number;
  finishedAt: number | null;
  errors: Array<{ index: number; reason: string }>;
}

const CHUNK_SIZE = 25;

// Tiny RFC4180-ish CSV parser. Handles quoted fields, escaped quotes, commas.
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
};

const headerIndex = (headers: string[], names: string[]): number => {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const n of names) {
    const i = lower.indexOf(n);
    if (i !== -1) return i;
  }
  return -1;
};

const MAX_WARNINGS = 50;

const mapRows = (
  matrix: string[][],
): { rows: ParsedRow[]; warnings: string[]; skipped: number } => {
  const warnings: string[] = [];
  let skipped = 0;
  if (matrix.length < 2) return { rows: [], warnings: ["empty file"], skipped: 0 };
  const [headerRaw, ...body] = matrix;
  const header = headerRaw ?? [];
  const dateIdx = headerIndex(header, ["date"]);
  const acctIdx = headerIndex(header, ["account"]);
  const catIdx = headerIndex(header, ["category"]);
  const amtIdx = headerIndex(header, ["amount"]);
  const descIdx = headerIndex(header, ["description", "note", "notes"]);
  if (dateIdx === -1 || acctIdx === -1 || catIdx === -1 || amtIdx === -1) {
    warnings.push("missing required columns: date, account, category, amount");
    return { rows: [], warnings, skipped: 0 };
  }
  const rows: ParsedRow[] = [];
  body.forEach((r, i) => {
    const date = (r[dateIdx] ?? "").trim();
    const account = (r[acctIdx] ?? "").trim();
    const category = (r[catIdx] ?? "").trim();
    const amountRaw = (r[amtIdx] ?? "").trim().replace(/,/g, "");
    const amount = Number(amountRaw);
    const description = descIdx === -1 ? "" : (r[descIdx] ?? "").trim();
    if (!date || !account || !category || !Number.isFinite(amount)) {
      skipped++;
      if (warnings.length < MAX_WARNINGS) {
        warnings.push(`row ${i + 2}: skipped (missing field or non-numeric amount)`);
      }
      return;
    }
    rows.push({ date, account, category, amount, description });
  });
  return { rows, warnings, skipped };
};

const formatEta = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
};

export function ImportScreen({ currency }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>("mdy");
  const [stats, setStats] = useState<RunStats | null>(null);
  const [running, setRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetResult, setResetResult] = useState<string | null>(null);
  const cancelRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetMutation = useResetTransactions();
  const router = useRouter();

  const closeImport = (): void => {
    window.close();
    setTimeout(() => {
      if (!window.closed) router.back();
    }, 50);
  };

  const onFile = async (f: File): Promise<void> => {
    setFileName(f.name);
    setStats(null);
    const raw = await f.text();
    const text = raw.replace(/^\uFEFF/, "");
    const matrix = parseCsv(text);
    const { rows: parsed, warnings: w, skipped: s } = mapRows(matrix);
    setRows(parsed);
    setWarnings(w);
    setSkipped(s);
    setShowPreview(parsed.length <= 200);
  };

  const reset = (): void => {
    setRows([]);
    setWarnings([]);
    setSkipped(0);
    setFileName(null);
    setStats(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const start = async (): Promise<void> => {
    if (rows.length === 0 || running) return;
    cancelRef.current = false;
    const initial: RunStats = {
      total: rows.length,
      processed: 0,
      created: 0,
      errorCount: 0,
      startedAt: Date.now(),
      finishedAt: null,
      errors: [],
    };
    setStats(initial);
    setRunning(true);
    let processed = 0;
    let created = 0;
    let errorCount = 0;
    const allErrors: Array<{ index: number; reason: string }> = [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      if (cancelRef.current) break;
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch("/api/import/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk, dateFormat }),
        });
        if (!res.ok) {
          const txt = await res.text();
          errorCount += chunk.length;
          allErrors.push({ index: i, reason: `chunk failed: ${txt.slice(0, 120)}` });
        } else {
          const data = (await res.json()) as {
            created: number;
            errors: Array<{ index: number; reason: string }>;
          };
          created += data.created;
          errorCount += data.errors.length;
          allErrors.push(
            ...data.errors.map((e) => ({ index: i + e.index, reason: e.reason })),
          );
        }
      } catch (err) {
        errorCount += chunk.length;
        allErrors.push({
          index: i,
          reason: `network: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
      processed += chunk.length;
      setStats((prev) =>
        prev
          ? {
              ...prev,
              processed,
              created,
              errorCount,
              errors: allErrors.slice(-50),
            }
          : prev,
      );
    }
    setStats((prev) => (prev ? { ...prev, finishedAt: Date.now() } : prev));
    setRunning(false);
  };

  const cancel = (): void => {
    cancelRef.current = true;
  };

  const confirmReset = async (): Promise<void> => {
    if (resetText !== "reset") return;
    setResetResult(null);
    try {
      const res = await resetMutation.mutateAsync();
      setResetResult(`removed ${res.deleted} transactions`);
      setResetMode(false);
      setResetText("");
    } catch (err) {
      setResetResult(err instanceof Error ? err.message : "reset failed");
    }
  };

  const progress = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.min(1, stats.processed / stats.total);
  }, [stats]);

  const etaMs = useMemo(() => {
    if (!stats || stats.processed === 0 || stats.finishedAt) return 0;
    const elapsed = Date.now() - stats.startedAt;
    const perRow = elapsed / stats.processed;
    return Math.round(perRow * (stats.total - stats.processed));
  }, [stats]);

  const elapsedLabel = useMemo(() => {
    if (!stats) return "—";
    const end = stats.finishedAt ?? Date.now();
    return formatEta(end - stats.startedAt);
  }, [stats]);

  return (
    <div
      className="min-h-dvh p-4 lg:mx-auto lg:max-w-3xl"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <header className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={closeImport}
          className="font-mono text-[11px] uppercase tracking-wider"
          style={{ color: "var(--fgMuted)" }}
        >
          ← close
        </button>
        <h1 className="font-display text-[16px] font-medium">Import CSV</h1>
        <span className="w-12" />
      </header>

      <p className="mb-4 font-mono text-[11px]" style={{ color: "var(--fgDim)" }}>
        Expected columns: <span style={{ color: "var(--fgMuted)" }}>date, account, category, amount, currency, description</span>.
        Positive amounts become income, negative become expenses. Missing accounts and categories are created automatically.
      </p>

      {/* File picker */}
      <div
        className="mb-4 rounded-md p-4"
        style={{ background: "var(--surface)", border: "1px dashed var(--lineStrong)" }}
      >
        <label className="flex cursor-pointer flex-col items-start gap-2">
          <span className="txt-mono-label">choose file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={running}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
            className="block w-full text-[12px]"
          />
        </label>
        {fileName ? (
          <div className="mt-2 font-mono text-[11px]" style={{ color: "var(--fgMuted)" }}>
            {fileName} · {rows.length} valid rows{skipped > 0 ? ` · ${skipped} skipped` : ""}
          </div>
        ) : null}
      </div>

      {/* Date format */}
      <div className="mb-2 txt-mono-label">date format</div>
      <div className="mb-4 flex gap-2">
        {([
          ["mdy", "M/D/Y"],
          ["dmy", "D/M/Y"],
          ["ymd", "Y/M/D"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDateFormat(id)}
            disabled={running}
            className="flex-1 rounded-pill py-2 font-mono text-[11px] uppercase tracking-wider transition-colors duration-med disabled:opacity-50"
            style={
              dateFormat === id
                ? { background: "var(--fg)", color: "var(--bg)", border: "1px solid var(--fg)" }
                : { background: "transparent", color: "var(--fgMuted)", border: "1px solid var(--lineStrong)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Preview (collapsed by default for large files) */}
      {rows.length > 0 ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="mb-2 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--fgMuted)" }}
          >
            {showPreview ? "hide preview" : `show preview (first 8 of ${rows.length})`}
          </button>
          {showPreview ? (
            <div
              className="max-h-44 overflow-y-auto rounded-md p-2 font-mono text-[11px]"
              style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
            >
              {rows.slice(0, 8).map((r, i) => (
                <div key={i} className="flex gap-2" style={{ color: "var(--fgMuted)" }}>
                  <span style={{ width: 80 }}>{r.date}</span>
                  <span style={{ width: 60 }}>{r.account}</span>
                  <span style={{ width: 80 }}>{r.category}</span>
                  <span
                    className="tabular-nums"
                    style={{
                      width: 96,
                      textAlign: "right",
                      color: r.amount >= 0 ? "var(--pos)" : "var(--neg)",
                    }}
                  >
                    {r.amount >= 0 ? "+" : "−"}
                    {formatAmount(toMinor(Math.abs(r.amount), currency), currency)}
                  </span>
                  <span className="truncate" style={{ color: "var(--fgDim)" }}>
                    {r.description}
                  </span>
                </div>
              ))}
              {rows.length > 8 ? (
                <div className="mt-1" style={{ color: "var(--fgDim)" }}>
                  … {rows.length - 8} more
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div
          className="mb-4 max-h-32 overflow-y-auto rounded-md p-2 font-mono text-[11px]"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--neg)",
            color: "var(--neg)",
          }}
        >
          {warnings.slice(0, 20).map((w, i) => (
            <div key={i}>{w}</div>
          ))}
          {skipped > warnings.length ? (
            <div className="mt-1" style={{ color: "var(--fgDim)" }}>
              … {skipped - warnings.length} more skipped (not shown)
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Run controls */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={start}
          disabled={rows.length === 0 || running}
          className="flex-1 rounded-md py-3 text-[14px] font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accentInk)" }}
        >
          {running ? "Importing…" : `Import ${rows.length} rows`}
        </button>
        {running ? (
          <button
            type="button"
            onClick={cancel}
            className="rounded-md px-4 py-3 text-[12px] font-medium"
            style={{
              background: "transparent",
              color: "var(--neg)",
              border: "1px solid var(--neg)",
            }}
          >
            Stop
          </button>
        ) : stats ? (
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-4 py-3 text-[12px] font-medium"
            style={{
              background: "transparent",
              color: "var(--fgMuted)",
              border: "1px solid var(--lineStrong)",
            }}
          >
            Reset
          </button>
        ) : null}
      </div>

      {/* Danger zone — wipe all transactions */}
      <div className="mb-4">
        {!resetMode ? (
          <button
            type="button"
            onClick={() => {
              setResetResult(null);
              setResetMode(true);
            }}
            disabled={running || resetMutation.isPending}
            className="w-full rounded-md py-2 font-mono text-[11px] uppercase tracking-wider disabled:opacity-50"
            style={{
              background: "transparent",
              color: "var(--neg)",
              border: "1px dashed var(--neg)",
            }}
          >
            Reset all transactions
          </button>
        ) : (
          <div
            className="rounded-md p-3"
            style={{ background: "var(--surface2)", border: "1px solid var(--neg)" }}
          >
            <div className="mb-2 font-mono text-[11px]" style={{ color: "var(--neg)" }}>
              This will permanently delete every transaction on your account.
              Accounts and categories are kept. Type <span className="font-bold">reset</span> to confirm.
            </div>
            <input
              type="text"
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              placeholder="reset"
              spellCheck={false}
              autoComplete="off"
              autoFocus
              className="card-sunk mb-2 w-full px-3 py-2 font-mono text-[12px] outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmReset}
                disabled={resetText !== "reset" || resetMutation.isPending}
                className="flex-1 rounded-md py-2 text-[12px] font-medium disabled:opacity-50"
                style={{ background: "var(--neg)", color: "var(--bg)" }}
              >
                {resetMutation.isPending ? "Resetting…" : "Confirm reset"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setResetText("");
                }}
                disabled={resetMutation.isPending}
                className="rounded-md px-4 py-2 text-[12px] font-medium disabled:opacity-50"
                style={{
                  background: "transparent",
                  color: "var(--fgMuted)",
                  border: "1px solid var(--lineStrong)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {resetResult ? (
          <p
            className="mt-2 text-center font-mono text-[11px]"
            style={{ color: resetResult.startsWith("removed") ? "var(--pos)" : "var(--neg)" }}
          >
            {resetResult}
          </p>
        ) : null}
      </div>

      {/* Progress */}
      {stats ? (
        <div
          className="rounded-md p-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
            <span style={{ color: "var(--fgMuted)" }}>
              {stats.processed} / {stats.total}
            </span>
            <span
              className="tabular-nums"
              style={{ color: stats.finishedAt ? "var(--pos)" : "var(--fgMuted)" }}
            >
              {stats.finishedAt ? "done" : `eta ${formatEta(etaMs)}`} · {Math.round(progress * 100)}%
            </span>
          </div>
          <div
            className="relative h-2 w-full overflow-hidden rounded-full"
            style={{ background: "var(--surface2)" }}
          >
            <div
              className="h-full transition-[width] duration-300 ease-out"
              style={{
                width: `${progress * 100}%`,
                background: stats.finishedAt ? "var(--pos)" : "var(--accent)",
              }}
            />
            {running ? (
              <div
                className="absolute inset-y-0 w-1/3 animate-[shimmer_1.6s_ease-in-out_infinite]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                }}
              />
            ) : null}
          </div>
          <div
            className="mt-2 flex items-center justify-between font-mono text-[10px]"
            style={{ color: "var(--fgDim)" }}
          >
            <span>elapsed {elapsedLabel}</span>
            <span>
              <span style={{ color: "var(--pos)" }}>{stats.created} created</span>
              {stats.errorCount > 0 ? (
                <>
                  {" · "}
                  <span style={{ color: "var(--neg)" }}>{stats.errorCount} failed</span>
                </>
              ) : null}
            </span>
          </div>
          {stats.errors.length > 0 ? (
            <div
              className="mt-2 max-h-32 overflow-y-auto rounded-md p-2 font-mono text-[10px]"
              style={{ background: "var(--surface2)", color: "var(--neg)" }}
            >
              {stats.errors.slice(-10).map((e, i) => (
                <div key={i}>
                  row {e.index + 2}: {e.reason}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
