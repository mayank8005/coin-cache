export type PaletteId =
  | "default"
  | "paper"
  | "cobalt"
  | "midnight"
  | "charcoal"
  | "matcha"
  | "plum"
  | "cyan"
  | "rose";

export type VizStyle = "rings" | "pie";
export type ChipStyle = "rings" | "pill" | "block" | "mono";
export type CurrencyCode = "INR" | "USD";
export type AccountKind = "current" | "credit" | "savings" | "cash";
export type TxnKind = "expense" | "income";

export interface PaletteTokens {
  id: PaletteId;
  name: string;
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  lineStrong: string;
  fg: string;
  fgMuted: string;
  fgDim: string;
  accent: string;
  accentInk: string;
  pos: string;
  neg: string;
  aiTint: string;
  aiLine: string;
  mode: "light" | "dark";
}

export interface CategoryPreset {
  id: string;
  label: string;
  mono: string;
  iconId: string;
  colorHex: string;
  kind: TxnKind;
}

export interface AccountPreset {
  id: string;
  label: string;
  kind: AccountKind;
  mono: string;
  colorHex: string;
  last4?: string;
}
