import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { DEFAULT_ACCOUNTS } from "@/constants/accounts";
import { encryptForUser } from "./crypto";
import { newId } from "@/utils/id";

export const seedDefaultsForUser = async (userId: string): Promise<void> => {
  const catData: Prisma.CategoryCreateManyInput[] = DEFAULT_CATEGORIES.map((c) => ({
    id: newId(),
    userId,
    label: c.label,
    mono: c.mono,
    iconId: c.iconId,
    colorHex: c.colorHex,
    kind: c.kind,
  }));

  const acctData: Prisma.AccountCreateManyInput[] = DEFAULT_ACCOUNTS.map((a) => ({
    id: newId(),
    userId,
    label: a.label,
    kind: a.kind,
    mono: a.mono,
    colorHex: a.colorHex,
    last4Enc: a.last4 ? encryptForUser(userId, a.last4) : null,
  }));

  await prisma.$transaction([
    prisma.category.createMany({ data: catData }),
    prisma.account.createMany({ data: acctData }),
  ]);
};
