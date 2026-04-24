import { NextResponse } from "next/server";
import { CreateAccountSchema } from "@/utils/validation";
import { accountsForUser, createAccount } from "@/lib/repo";
import { ok, parseJson, withUser } from "@/lib/api-helpers";

export const GET = (): Promise<NextResponse> =>
  withUser(async (u) => ok({ accounts: await accountsForUser(u.id) }));

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const input = await parseJson(req, CreateAccountSchema);
    const created = await createAccount(u.id, input);
    return ok({ account: created }, { status: 201 });
  });
