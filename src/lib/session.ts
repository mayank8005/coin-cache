import { auth } from "./auth";
import { prisma } from "./db";
import type { ChipRep, ChipStyle, CurrencyCode, PaletteId, VizStyle } from "@/types/design";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  paletteId: PaletteId;
  vizStyle: VizStyle;
  chipStyle: ChipStyle;
  chipRep: ChipRep;
  currency: CurrencyCode;
  llmBaseUrl: string | null;
  llmApiKey: string | null;
  llmModel: string | null;
}

const loadFresh = async (id: string): Promise<SessionUser | null> => {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      paletteId: true,
      vizStyle: true,
      chipStyle: true,
      chipRep: true,
      currency: true,
      llmBaseUrl: true,
      llmApiKey: true,
      llmModel: true,
    },
  });
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    paletteId: u.paletteId as PaletteId,
    vizStyle: u.vizStyle as VizStyle,
    chipStyle: u.chipStyle as ChipStyle,
    chipRep: u.chipRep as ChipRep,
    currency: u.currency as CurrencyCode,
    llmBaseUrl: u.llmBaseUrl,
    llmApiKey: u.llmApiKey,
    llmModel: u.llmModel,
  };
};

export const requireUser = async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const fresh = await loadFresh(session.user.id);
  if (!fresh) throw new UnauthorizedError();
  return fresh;
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return loadFresh(session.user.id);
};

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
