export interface AccountDto {
  id: string;
  label: string;
  kind: string;
  mono: string;
  last4: string | null;
  colorHex: string;
  archived: boolean;
}

export interface CategoryDto {
  id: string;
  label: string;
  mono: string;
  iconId: string;
  colorHex: string;
  kind: string;
}

export interface TransactionDto {
  id: string;
  accountId: string;
  categoryId: string;
  amountMinor: number;
  note: string;
  occurredAt: string;
  kind: string;
  aiCategorized: boolean;
  aiConfidence: number | null;
  flagged: boolean;
}
