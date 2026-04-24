import type { AccountPreset } from "@/types/design";

export const ACCOUNT_KINDS = ["current", "credit", "savings", "cash"] as const;

export const DEFAULT_ACCOUNTS: AccountPreset[] = [
  { id: "main", label: "Main", kind: "current", mono: "04", colorHex: "#3F6B3A", last4: "4128" },
  { id: "savings", label: "Savings", kind: "savings", mono: "SV", colorHex: "#7FAFE0", last4: "8821" },
  { id: "cash", label: "Cash", kind: "cash", mono: "££", colorHex: "#C7C2B6" },
];
