import type { CategoryPreset } from "@/types/design";

export const CATEGORY_ICONS = [
  "food",
  "rent",
  "groc",
  "trans",
  "bills",
  "fun",
  "health",
  "kids",
  "home",
  "gifts",
  "subs",
  "misc",
] as const;

export type CategoryIconId = (typeof CATEGORY_ICONS)[number];

export const DEFAULT_CATEGORIES: CategoryPreset[] = [
  { id: "food", label: "Food", mono: "Fo", iconId: "food", colorHex: "#B7E16A", kind: "expense" },
  { id: "rent", label: "Rent", mono: "Re", iconId: "rent", colorHex: "#7FAFE0", kind: "expense" },
  { id: "groc", label: "Groc", mono: "Gr", iconId: "groc", colorHex: "#6FD3A0", kind: "expense" },
  { id: "trans", label: "Trans", mono: "Tr", iconId: "trans", colorHex: "#E8A878", kind: "expense" },
  { id: "bills", label: "Bills", mono: "Bi", iconId: "bills", colorHex: "#B08FE0", kind: "expense" },
  { id: "fun", label: "Fun", mono: "Fu", iconId: "fun", colorHex: "#E280B8", kind: "expense" },
  { id: "health", label: "Health", mono: "He", iconId: "health", colorHex: "#76D3D8", kind: "expense" },
  { id: "kids", label: "Kids", mono: "Ki", iconId: "kids", colorHex: "#E8D070", kind: "expense" },
  { id: "home", label: "Home", mono: "Ho", iconId: "home", colorHex: "#A5A0E8", kind: "expense" },
  { id: "gifts", label: "Gifts", mono: "Gi", iconId: "gifts", colorHex: "#E87B9C", kind: "expense" },
  { id: "subs", label: "Subs", mono: "Su", iconId: "subs", colorHex: "#7BCFE0", kind: "expense" },
  { id: "misc", label: "Misc", mono: "Mi", iconId: "misc", colorHex: "#C7C2B6", kind: "expense" },
];

export const DEFAULT_CATEGORY_SWATCHES = [
  "#3F6B3A",
  "#B7E16A",
  "#7FAFE0",
  "#E8A878",
  "#B08FE0",
  "#E280B8",
  "#76D3D8",
  "#E8D070",
  "#A5A0E8",
  "#E87B9C",
];
