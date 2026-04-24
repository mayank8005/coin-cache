import { prisma } from "./db";
import { newId } from "@/utils/id";

interface Entry {
  actor: string;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown>;
}

export const audit = async (entry: Entry): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        id: newId(),
        actor: entry.actor,
        action: entry.action,
        target: entry.target ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
      },
    });
  } catch (err) {
    console.error("audit failed:", err);
  }
};
