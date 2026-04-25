"use client";

import { useState, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind: "plus" | "minus";
  size?: number;
}

export function PlusMinusButton({ kind, size = 72, className, onClick, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  const isPlus = kind === "plus";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      aria-label={isPlus ? "Add income" : "Add expense"}
      className={cn(
        "flex items-center justify-center transition-transform duration-fast",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: isPlus ? "var(--accent)" : "var(--surface2)",
        color: isPlus ? "var(--accentInk)" : "var(--fg)",
        border: isPlus ? "none" : "1px solid var(--lineStrong)",
        boxShadow: isPlus ? "0 10px 30px -6px color-mix(in oklab, var(--accent) 33%, transparent)" : "none",
        fontSize: size * 0.5,
        lineHeight: 1,
        paddingBottom: isPlus ? 4 : 6,
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        transform: pressed ? "scale(0.94)" : "scale(1)",
      }}
      {...rest}
    >
      {isPlus ? "+" : "\u2212"}
    </button>
  );
}
