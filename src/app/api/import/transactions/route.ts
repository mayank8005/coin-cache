import type { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ImportTransactionsSchema, type ImportRow } from "@/utils/validation";
import { ok, parseJson, withUser } from "@/lib/api-helpers";
import { newId } from "@/utils/id";
import { monoCodeFrom } from "@/utils/format";
import { DEFAULT_CATEGORY_SWATCHES } from "@/constants/categories";
import { CURRENCIES } from "@/constants/currencies";
import type { CurrencyCode } from "@/types/design";

interface ImportError {
  index: number;
  reason: string;
}

const normaliseLabel = (s: string): string => s.trim().toLowerCase();

const parseDate = (raw: string, format: "mdy" | "dmy" | "ymd"): Date | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[/.\-T\s:]+/).filter(Boolean);
  if (parts.length < 3) return null;
  let y: number;
  let m: number;
  let d: number;
  if (format === "ymd") {
    y = Number(parts[0]);
    m = Number(parts[1]);
    d = Number(parts[2]);
  } else if (format === "dmy") {
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = Number(parts[2]);
  } else {
    m = Number(parts[0]);
    d = Number(parts[1]);
    y = Number(parts[2]);
  }
  if (y < 100) y += 2000;
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  let hh = 0;
  let mm = 0;
  if (parts.length >= 5) {
    hh = Number(parts[3]) || 0;
    mm = Number(parts[4]) || 0;
  }
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const input = await parseJson(req, ImportTransactionsSchema);
    const currency = u.currency as CurrencyCode;
    const minorMultiplier = CURRENCIES[currency].minorUnits;

    const accounts = await prisma.account.findMany({
      where: { userId: u.id, archived: false },
    });
    const categories = await prisma.category.findMany({
      where: { userId: u.id, archived: false },
    });
    const accountByLabel = new Map(accounts.map((a) => [normaliseLabel(a.label), a]));
    const categoryByKey = new Map(
      categories.map((c) => [`${c.kind}:${normaliseLabel(c.label)}`, c]),
    );

    const errors: ImportError[] = [];
    let created = 0;
    let swatchCursor = categories.length;

    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i] as ImportRow;
      try {
        const occurredAt = parseDate(row.date, input.dateFormat ?? "mdy");
        if (!occurredAt) {
          errors.push({ index: i, reason: `bad date: ${row.date}` });
          continue;
        }
        const kind: "expense" | "income" = row.amount >= 0 ? "income" : "expense";
        const amountMinor = Math.round(Math.abs(row.amount) * minorMultiplier);
        if (amountMinor <= 0) {
          errors.push({ index: i, reason: "zero amount" });
          continue;
        }

        const acctKey = normaliseLabel(row.account);
        let acct = accountByLabel.get(acctKey);
        if (!acct) {
          acct = await prisma.account.create({
            data: {
              id: newId(),
              userId: u.id,
              label: row.account.trim(),
              kind: "cash",
              mono: monoCodeFrom(row.account),
              colorHex:
                DEFAULT_CATEGORY_SWATCHES[
                  accountByLabel.size % DEFAULT_CATEGORY_SWATCHES.length
                ] ?? "#7FAFE0",
            },
          });
          accountByLabel.set(acctKey, acct);
        }

        const catKey = `${kind}:${normaliseLabel(row.category)}`;
        let cat = categoryByKey.get(catKey);
        if (!cat) {
          cat = await prisma.category.create({
            data: {
              id: newId(),
              userId: u.id,
              label: row.category.trim(),
              mono: monoCodeFrom(row.category),
              iconId: "misc",
              colorHex:
                DEFAULT_CATEGORY_SWATCHES[swatchCursor % DEFAULT_CATEGORY_SWATCHES.length] ??
                "#C7C2B6",
              kind,
            },
          });
          swatchCursor++;
          categoryByKey.set(catKey, cat);
        }

        await prisma.transaction.create({
          data: {
            id: newId(),
            userId: u.id,
            accountId: acct.id,
            categoryId: cat.id,
            amountMinor,
            note: row.description.trim(),
            occurredAt,
            kind,
            aiCategorized: false,
            aiConfidence: null,
            flagged: false,
          },
        });
        created++;
      } catch (err) {
        errors.push({
          index: i,
          reason: err instanceof Error ? err.message : "unknown",
        });
      }
    }

    return ok({ created, errors });
  });
