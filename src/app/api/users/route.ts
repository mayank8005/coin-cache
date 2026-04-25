import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api-helpers";

export const GET = async (): Promise<NextResponse> =>
  handle(async () => {
    const users = await prisma.user.findMany({
      select: { id: true, displayName: true, initials: true, color: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    return ok({ users });
  });
