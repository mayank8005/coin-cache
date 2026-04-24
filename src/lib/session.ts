import { auth } from "./auth";
import type { ChipStyle, CurrencyCode, PaletteId, VizStyle } from "@/types/design";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  paletteId: PaletteId;
  vizStyle: VizStyle;
  chipStyle: ChipStyle;
  currency: CurrencyCode;
}

export const requireUser = async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new UnauthorizedError();
  }
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    paletteId: session.user.paletteId as PaletteId,
    vizStyle: session.user.vizStyle as VizStyle,
    chipStyle: session.user.chipStyle as ChipStyle,
    currency: session.user.currency as CurrencyCode,
  };
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    paletteId: session.user.paletteId as PaletteId,
    vizStyle: session.user.vizStyle as VizStyle,
    chipStyle: session.user.chipStyle as ChipStyle,
    currency: session.user.currency as CurrencyCode,
  };
};

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
