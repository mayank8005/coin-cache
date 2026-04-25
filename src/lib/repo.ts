import { prisma } from "./db";
import { newId } from "@/utils/id";
import { decryptForUser, encryptForUser } from "./crypto";
import { monoCodeFrom } from "@/utils/format";
import { NotFoundError } from "./api-helpers";
import type { Prisma } from "@prisma/client";

interface AccountDto {
  id: string;
  label: string;
  kind: string;
  mono: string;
  last4: string | null;
  colorHex: string;
  archived: boolean;
}

export const accountsForUser = async (userId: string): Promise<AccountDto[]> => {
  const rows = await prisma.account.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    kind: r.kind,
    mono: r.mono,
    last4: r.last4Enc ? decryptForUser(userId, r.last4Enc) : null,
    colorHex: r.colorHex,
    archived: r.archived,
  }));
};

export const createAccount = async (
  userId: string,
  input: {
    label: string;
    kind: string;
    mono?: string;
    last4?: string | null;
    colorHex: string;
  },
): Promise<AccountDto> => {
  const created = await prisma.account.create({
    data: {
      id: newId(),
      userId,
      label: input.label,
      kind: input.kind,
      mono: input.mono ?? monoCodeFrom(input.label),
      last4Enc: input.last4 ? encryptForUser(userId, input.last4) : null,
      colorHex: input.colorHex,
    },
  });
  return {
    id: created.id,
    label: created.label,
    kind: created.kind,
    mono: created.mono,
    last4: input.last4 ?? null,
    colorHex: created.colorHex,
    archived: created.archived,
  };
};

interface CategoryDto {
  id: string;
  label: string;
  mono: string;
  iconId: string;
  colorHex: string;
  kind: string;
}

export const categoriesForUser = async (userId: string): Promise<CategoryDto[]> => {
  const rows = await prisma.category.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    mono: r.mono,
    iconId: r.iconId,
    colorHex: r.colorHex,
    kind: r.kind,
  }));
};

export const createCategory = async (
  userId: string,
  input: {
    label: string;
    mono?: string;
    iconId: string;
    colorHex: string;
    kind: string;
  },
): Promise<CategoryDto> => {
  const created = await prisma.category.create({
    data: {
      id: newId(),
      userId,
      label: input.label,
      mono: input.mono ?? monoCodeFrom(input.label),
      iconId: input.iconId,
      colorHex: input.colorHex,
      kind: input.kind,
    },
  });
  return {
    id: created.id,
    label: created.label,
    mono: created.mono,
    iconId: created.iconId,
    colorHex: created.colorHex,
    kind: created.kind,
  };
};

interface TransactionDto {
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

export interface TransactionFilter {
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  kind?: string;
  flagged?: boolean;
  limit?: number;
}

const serialize = (t: Prisma.TransactionGetPayload<Record<string, never>>): TransactionDto => ({
  id: t.id,
  accountId: t.accountId,
  categoryId: t.categoryId,
  amountMinor: t.amountMinor,
  note: t.note,
  occurredAt: t.occurredAt.toISOString(),
  kind: t.kind,
  aiCategorized: t.aiCategorized,
  aiConfidence: t.aiConfidence ?? null,
  flagged: t.flagged,
});

export const listTransactions = async (
  userId: string,
  f: TransactionFilter,
): Promise<TransactionDto[]> => {
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      ...(f.from || f.to
        ? { occurredAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } }
        : {}),
      ...(f.accountId ? { accountId: f.accountId } : {}),
      ...(f.categoryId ? { categoryId: f.categoryId } : {}),
      ...(f.kind ? { kind: f.kind } : {}),
      ...(f.flagged !== undefined ? { flagged: f.flagged } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: Math.min(500, Math.max(1, f.limit ?? 100)),
  });
  return rows.map(serialize);
};

export const createTransaction = async (
  userId: string,
  input: {
    accountId: string;
    categoryId: string;
    amountMinor: number;
    note: string;
    occurredAt: Date;
    kind: string;
    aiCategorized?: boolean;
    aiConfidence?: number | null;
    flagged?: boolean;
  },
): Promise<TransactionDto> => {
  // Defense in depth: ensure account & category belong to this user.
  const [acct, cat] = await Promise.all([
    prisma.account.findFirst({ where: { id: input.accountId, userId } }),
    prisma.category.findFirst({ where: { id: input.categoryId, userId } }),
  ]);
  if (!acct) throw new NotFoundError("Account not found");
  if (!cat) throw new NotFoundError("Category not found");

  const created = await prisma.transaction.create({
    data: {
      id: newId(),
      userId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      amountMinor: input.amountMinor,
      note: input.note,
      occurredAt: input.occurredAt,
      kind: input.kind,
      aiCategorized: input.aiCategorized ?? false,
      aiConfidence: input.aiConfidence ?? null,
      flagged: input.flagged ?? false,
    },
  });
  return serialize(created);
};

export const deleteTransaction = async (userId: string, id: string): Promise<void> => {
  await prisma.transaction.deleteMany({ where: { id, userId } });
};

export const updateTransaction = async (
  userId: string,
  id: string,
  input: Partial<{
    accountId: string;
    categoryId: string;
    amountMinor: number;
    note: string;
    occurredAt: Date;
    kind: string;
    flagged: boolean;
  }>,
): Promise<TransactionDto | null> => {
  if (input.accountId || input.categoryId) {
    const checks = await Promise.all([
      input.accountId
        ? prisma.account.findFirst({ where: { id: input.accountId, userId } })
        : Promise.resolve(true),
      input.categoryId
        ? prisma.category.findFirst({ where: { id: input.categoryId, userId } })
        : Promise.resolve(true),
    ]);
    if (!checks[0]) throw new NotFoundError("Account not found");
    if (!checks[1]) throw new NotFoundError("Category not found");
  }
  const result = await prisma.transaction.updateMany({
    where: { id, userId },
    data: input,
  });
  if (result.count === 0) return null;
  const updated = await prisma.transaction.findFirst({ where: { id, userId } });
  return updated ? serialize(updated) : null;
};
