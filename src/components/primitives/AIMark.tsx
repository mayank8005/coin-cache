import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type Variant = "tint" | "underline" | "glyph" | "shimmer";

interface Props {
  children: ReactNode;
  variant?: Variant;
  confidence?: number;
  inline?: boolean;
  className?: string;
}

export function AIMark({ children, variant = "tint", confidence, inline = false, className }: Props) {
  if (variant === "underline") {
    return (
      <span
        className={cn("pb-[1px]", className)}
        style={{ borderBottom: "1px dashed var(--aiLine)" }}
      >
        {children}
      </span>
    );
  }

  if (variant === "glyph") {
    return (
      <span
        className={cn("inline-flex items-center gap-1 font-mono text-[11px]", className)}
        style={{ color: "var(--fgMuted)" }}
      >
        <span style={{ color: "var(--aiLine)" }}>··</span>
        {children}
        {typeof confidence === "number" ? (
          <span style={{ color: "var(--fgDim)" }}>{Math.round(confidence * 100)}%</span>
        ) : null}
      </span>
    );
  }

  if (variant === "shimmer") {
    return <span className={cn("ai-shimmer", className)}>{children}</span>;
  }

  // tint (block or inline container)
  return (
    <div
      className={cn("relative", className)}
      style={{
        background: "var(--aiTint)",
        borderLeft: "1px dashed var(--aiLine)",
        borderRadius: inline ? 4 : 8,
        padding: inline ? "2px 10px" : "10px 14px",
      }}
    >
      <span
        className="absolute right-2 top-1 font-mono text-[9px]"
        style={{ color: "var(--aiLine)" }}
      >
        ·· AI
      </span>
      {children}
    </div>
  );
}
