import { NextResponse } from "next/server";
import { CreateTransactionSchema, TransactionQuerySchema } from "@/utils/validation";
import { createTransaction, listTransactions } from "@/lib/repo";
import { ok, parseJson, withUser, bad } from "@/lib/api-helpers";

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
    try {
      const created = await createTransaction(u.id, {
        ...input,
        note: input.note ?? "",
        occurredAt: new Date(input.occurredAt),
      });
      return ok({ transaction: created }, { status: 201 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Create failed";
      if (msg.includes("not found")) return bad(msg, 404);
      throw err;
    }
  });
