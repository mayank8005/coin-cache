import { auth } from "./auth";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  paletteId: string;
  vizStyle: string;
  chipStyle: string;
  currency: string;
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
    paletteId: session.user.paletteId,
    vizStyle: session.user.vizStyle,
    chipStyle: session.user.chipStyle,
    currency: session.user.currency,
  };
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    paletteId: session.user.paletteId,
    vizStyle: session.user.vizStyle,
    chipStyle: session.user.chipStyle,
    currency: session.user.currency,
  };
};

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
