import type { CurrencyCode } from "@/types/design";
import { CURRENCIES } from "@/constants/currencies";

export const toMinor = (amount: number, currency: CurrencyCode): number =>
  Math.round(amount * CURRENCIES[currency].minorUnits);

export const fromMinor = (minor: number, currency: CurrencyCode): number =>
  minor / CURRENCIES[currency].minorUnits;

export interface FormatAmountOptions {
  signed?: boolean;
  abs?: boolean;
  compact?: boolean;
  fractionDigits?: number;
}

export const formatAmount = (
  minor: number,
  currency: CurrencyCode,
  opts: FormatAmountOptions = {},
): string => {
  const info = CURRENCIES[currency];
  const value = opts.abs ? Math.abs(fromMinor(minor, currency)) : fromMinor(minor, currency);
  const defaultDigits = currency === "USD" ? 2 : Number.isInteger(value) ? 0 : 2;
  const digits = opts.fractionDigits ?? defaultDigits;
  const body = new Intl.NumberFormat(info.locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: Math.max(digits, 2),
    ...(opts.compact ? { notation: "compact" as const } : {}),
  }).format(Math.abs(value));
  const sign = opts.signed ? (value > 0 ? "+" : value < 0 ? "\u2212" : " ") : value < 0 ? "\u2212" : "";
  return `${sign}${info.symbol}${body}`;
};

export const monoCodeFrom = (name: string): string => {
  const clean = name.trim();
  if (!clean) return "··";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return clean.slice(0, 2).replace(/^./, (c) => c.toUpperCase());
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatTime = (d: Date): string =>
  `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatRelativeDate = (d: Date, now: Date = new Date()): string => {
  if (sameDay(d, now)) return `Today · ${formatTime(d)}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return `Yesterday · ${formatTime(d)}`;
  const month = MONTHS_SHORT[d.getMonth()] ?? "";
  return `${month} ${d.getDate()} · ${formatTime(d)}`;
};

export const formatDayHeader = (d: Date, now: Date = new Date()): string => {
  if (sameDay(d, now)) return "TODAY";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "YESTERDAY";
  const month = MONTHS_SHORT[d.getMonth()] ?? "";
  return `${month.toUpperCase()} ${d.getDate()}`;
};

export const formatMonth = (d: Date): string =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
