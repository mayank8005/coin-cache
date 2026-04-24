import type { CurrencyCode } from "@/types/design";
import { formatAmount } from "@/utils/format";
import { cn } from "@/utils/cn";

interface Props {
  minor: number;
  currency: CurrencyCode;
  size?: number;
  signed?: boolean;
  className?: string;
  tone?: "auto" | "pos" | "neg" | "fg" | "muted";
}

export function Amount({ minor, currency, size = 16, signed = false, tone = "auto", className }: Props) {
  const toneColor =
    tone === "pos"
      ? "var(--pos)"
      : tone === "neg"
        ? "var(--neg)"
        : tone === "muted"
          ? "var(--fgMuted)"
          : tone === "fg"
            ? "var(--fg)"
            : minor > 0
              ? "var(--pos)"
              : minor < 0
                ? "var(--neg)"
                : "var(--fg)";

  return (
    <span
      className={cn("font-mono font-medium tabular-nums tracking-tight", className)}
      style={{ color: toneColor, fontSize: size, letterSpacing: "-0.04em" }}
    >
      {formatAmount(minor, currency, { signed })}
    </span>
  );
}
