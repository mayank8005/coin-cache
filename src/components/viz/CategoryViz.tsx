"use client";

import type { CurrencyCode, VizStyle } from "@/types/design";
import { PieViz, type CategoryTotal } from "./PieViz";
import { SegmentedRadial } from "./SegmentedRadial";

interface Props {
  totals: CategoryTotal[];
  vizStyle: VizStyle;
  size?: number;
  spentMinor: number;
  budgetMinor: number;
  currency: CurrencyCode;
}

export function CategoryViz({ vizStyle, ...rest }: Props) {
  return vizStyle === "pie" ? <PieViz {...rest} /> : <SegmentedRadial {...rest} />;
}
