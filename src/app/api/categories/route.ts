import { NextResponse } from "next/server";
import { CreateCategorySchema } from "@/utils/validation";
import { categoriesForUser, createCategory } from "@/lib/repo";
import { ok, parseJson, withUser } from "@/lib/api-helpers";

export const GET = (): Promise<NextResponse> =>
  withUser(async (u) => ok({ categories: await categoriesForUser(u.id) }));

export const POST = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const input = await parseJson(req, CreateCategorySchema);
    const created = await createCategory(u.id, input);
    return ok({ category: created }, { status: 201 });
  });
