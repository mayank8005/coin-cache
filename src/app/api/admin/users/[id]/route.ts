import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, bad, ok } from "@/lib/api-helpers";
import { AdminForbiddenError, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/audit";

export const DELETE = async (
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> =>
  handle(async () => {
    try {
      await requireAdmin(req);
    } catch (e) {
      if (e instanceof AdminForbiddenError) return bad(e.message, 403);
      throw e;
    }
    const { id } = await ctx.params;
    const isEmail = id.includes("@");
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: id.toLowerCase() } })
      : await prisma.user.findUnique({ where: { id } });
    if (!user) return bad("User not found", 404);
    await prisma.user.delete({ where: { id: user.id } });
    await audit({ actor: "admin", action: "user.delete", target: user.email });
    return ok({ deleted: user.email });
  });
