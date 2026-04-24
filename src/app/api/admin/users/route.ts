import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CreateUserSchema } from "@/utils/validation";
import { hashPassword } from "@/lib/crypto";
import { handle, bad, ok, parseJson } from "@/lib/api-helpers";
import { AdminForbiddenError, requireAdmin } from "@/lib/admin-guard";
import { seedDefaultsForUser } from "@/lib/seed-user";
import { newId } from "@/utils/id";
import { monoCodeFrom } from "@/utils/format";
import { audit } from "@/lib/audit";

export const POST = async (req: Request): Promise<NextResponse> =>
  handle(async () => {
    try {
      await requireAdmin(req);
    } catch (e) {
      if (e instanceof AdminForbiddenError) return bad(e.message, 403);
      throw e;
    }
    const input = await parseJson(req, CreateUserSchema);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return bad("Email already exists", 409);
    const id = newId();
    const user = await prisma.user.create({
      data: {
        id,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        displayName: input.displayName,
        initials: monoCodeFrom(input.displayName),
      },
    });
    await seedDefaultsForUser(id);
    await audit({ actor: "admin", action: "user.create", target: user.email });
    return ok({ id: user.id, email: user.email, displayName: user.displayName }, { status: 201 });
  });

export const GET = async (req: Request): Promise<NextResponse> =>
  handle(async () => {
    try {
      await requireAdmin(req);
    } catch (e) {
      if (e instanceof AdminForbiddenError) return bad(e.message, 403);
      throw e;
    }
    const users = await prisma.user.findMany({
      select: { id: true, email: true, displayName: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return ok({ users });
  });
