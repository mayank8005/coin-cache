"use client";

import { useSession } from "next-auth/react";
import type { CurrencyCode, VizStyle, ChipStyle, PaletteId } from "@/types/design";

export interface CurrentUserView {
  id: string;
  email: string;
  displayName: string;
  paletteId: PaletteId;
  vizStyle: VizStyle;
  chipStyle: ChipStyle;
  currency: CurrencyCode;
}

export const useCurrentUser = (): CurrentUserView | null => {
  const { data } = useSession();
  const u = data?.user;
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    displayName: u.displayName,
    paletteId: u.paletteId as PaletteId,
    vizStyle: u.vizStyle as VizStyle,
    chipStyle: u.chipStyle as ChipStyle,
    currency: u.currency as CurrencyCode,
  };
};
