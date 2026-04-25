import type { AccountPreset } from "@/types/design";

export const ACCOUNT_KINDS = ["current", "credit", "savings", "cash"] as const;

export const DEFAULT_ACCOUNTS: AccountPreset[] = [
  { id: "savings", label: "Savings", kind: "savings", mono: "SV", colorHex: "#7FAFE0", last4: "8821" },
  { id: "cash", label: "Cash", kind: "cash", mono: "$$", colorHex: "#C7C2B6" },
];
