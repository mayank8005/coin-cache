import type { CurrencyCode } from "@/types/design";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  minorUnits: number;
  label: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN", minorUnits: 100, label: "Indian Rupee" },
  USD: { code: "USD", symbol: "$", locale: "en-US", minorUnits: 100, label: "US Dollar" },
};

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
