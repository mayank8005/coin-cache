import type { NextResponse } from "next/server";
import { CreateTransactionSchema, TransactionQuerySchema } from "@/utils/validation";
import { createTransaction, listTransactions } from "@/lib/repo";
import { prisma } from "@/lib/db";
import { ok, parseJson, withUser, bad } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";

export const GET = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams);
    const q = TransactionQuerySchema.parse(raw);
    const rows = await listTransactions(u.id, {
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      accountId: q.accountId,
      categoryId: q.categoryId,
      kind: q.kind,
      flagged: q.flagged,
      limit: q.limit,
    });
    return ok({ transactions: rows });
  });

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const input = await parseJson(req, CreateTransactionSchema);
    const created = await createTransaction(u.id, {
      ...input,
      note: input.note ?? "",
      occurredAt: new Date(input.occurredAt),
    });
    return ok({ transaction: created }, { status: 201 });
  });

export const DELETE = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const url = new URL(req.url);
    if (url.searchParams.get("confirm") !== "reset") {
      return bad("missing confirm=reset", 400);
    }
    const result = await prisma.transaction.deleteMany({ where: { userId: u.id } });
    return ok({ deleted: result.count });
  });
