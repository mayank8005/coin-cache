import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UpdateSettingsSchema } from "@/utils/validation";
import { ok, parseJson, withUser } from "@/lib/api-helpers";

export const PATCH = (req: Request): Promise<NextResponse> =>
  withUser(async (u) => {
    const input = await parseJson(req, UpdateSettingsSchema);
    const updated = await prisma.user.update({
      where: { id: u.id },
      data: input,
      select: {
        displayName: true,
        paletteId: true,
        vizStyle: true,
        chipStyle: true,
        chipRep: true,
        currency: true,
      },
    });
    return ok({ settings: updated });
  });
