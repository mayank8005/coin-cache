import { NextResponse } from "next/server";
import { UpdateTransactionSchema } from "@/utils/validation";
import { deleteTransaction, updateTransaction } from "@/lib/repo";
import { ok, parseJson, withUser, bad } from "@/lib/api-helpers";

export const PATCH = (
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> =>
  withUser(async (u) => {
    const { id } = await ctx.params;
    const input = await parseJson(req, UpdateTransactionSchema);
    const updated = await updateTransaction(u.id, id, {
      ...input,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
    });
    if (!updated) return bad("Not found", 404);
    return ok({ transaction: updated });
  });

export const DELETE = (
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> =>
  withUser(async (u) => {
    const { id } = await ctx.params;
    await deleteTransaction(u.id, id);
    return ok({ deleted: id });
  });
