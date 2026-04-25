"use client";

import { type CSSProperties } from "react";
import type { ChipStyle } from "@/types/design";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/utils/cn";

export interface ChipCategory {
  id: string;
  label: string;
  mono: string;
  iconId: string;
  colorHex: string;
}

interface Props {
  cat: ChipCategory;
  selected: boolean;
  onClick?: () => void;
  size?: number;
  style?: ChipStyle;
  representation?: "mono" | "icon";
  disabled?: boolean;
  aiHint?: boolean;
}

export function CategoryChip({
  cat,
  selected,
  onClick,
  size = 72,
  style = "rings",
  representation = "mono",
  disabled,
  aiHint,
}: Props) {
  if (style === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-pill border transition-all duration-med",
          selected
            ? "border-transparent bg-accent text-accent-ink"
            : "border-line-strong text-fg hover:border-fg-muted",
        )}
        style={{ padding: "8px 14px 8px 10px" }}
      >
        <span
          className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-pill font-mono text-[10px]"
          style={{ background: selected ? "rgba(0,0,0,0.15)" : "var(--surface2)" }}
        >
          {representation === "mono" ? (
            cat.mono
          ) : (
            <CategoryIcon id={cat.iconId} size={12} color="currentColor" />
          )}
        </span>
        <span
          className="truncate text-[12px] font-medium"
          style={{ maxWidth: 140 }}
          title={cat.label}
        >
          {cat.label}
        </span>
        {aiHint ? <span className="font-mono text-[9px] text-ai-line">··</span> : null}
      </button>
    );
  }

  if (style === "block") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-md border transition-all duration-med",
          selected
            ? "border-transparent bg-accent text-accent-ink"
            : "border-line-strong bg-surface text-fg hover:border-fg-muted",
        )}
        style={{ width: size + 16, padding: 8, aspectRatio: "1 / 1" }}
      >
        {representation === "mono" ? (
          <span className="font-mono text-[18px] font-semibold">{cat.mono}</span>
        ) : (
          <CategoryIcon id={cat.iconId} size={22} />
        )}
        <span
          className="text-[11px] font-medium leading-tight"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            textAlign: "center",
          }}
          title={cat.label}
        >
          {cat.label}
        </span>
      </button>
    );
  }

  if (style === "mono") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex w-full items-center justify-between border-b border-dashed border-line py-2 text-[13px] transition-opacity duration-med"
      >
        <span className="flex items-center gap-2">
          {representation === "icon" ? (
            <span
              className={cn("flex h-[14px] w-[14px] items-center justify-center", selected ? "text-accent" : "text-fg-muted")}
            >
              <CategoryIcon id={cat.iconId} size={14} />
            </span>
          ) : (
            <span className={cn("font-mono text-fg-muted", selected && "text-accent")}>
              {selected ? "●" : "○"}
            </span>
          )}
          <span className={selected ? "text-fg" : "text-fg-muted"}>{cat.label}</span>
        </span>
        {representation === "icon" ? null : (
          <span className="font-mono text-[11px] text-fg-dim">{cat.mono.toLowerCase()}</span>
        )}
      </button>
    );
  }

  // Default: rings
  const innerSize = size - 14;
  const chipStyle: CSSProperties = {
    width: size,
    height: size,
    borderColor: selected ? "var(--accent)" : "var(--lineStrong)",
  };
  const innerStyle: CSSProperties = {
    width: innerSize,
    height: innerSize,
    background: selected ? "var(--accent)" : "transparent",
    borderColor: selected ? "transparent" : "var(--line)",
    color: selected ? "var(--accentInk)" : "var(--fg)",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 outline-none"
      aria-pressed={selected}
    >
      <span
        className="relative flex items-center justify-center rounded-pill border-[1.5px] transition-all ease-chip duration-slow"
        style={chipStyle}
      >
        <span
          className="flex items-center justify-center rounded-pill border transition-all ease-chip duration-slow"
          style={innerStyle}
        >
          {representation === "mono" ? (
            <span
              className="font-mono font-medium"
              style={{ fontSize: size * 0.28, letterSpacing: "-0.02em" }}
            >
              {cat.mono}
            </span>
          ) : (
            <CategoryIcon id={cat.iconId} size={size * 0.46} />
          )}
        </span>
        {aiHint ? (
          <span
            className="absolute font-mono text-[9px]"
            style={{ top: -2, right: -6, color: "var(--aiLine)" }}
          >
            ··
          </span>
        ) : null}
      </span>
      <span
        className={cn("text-[11px] font-medium leading-tight text-center")}
        style={{
          color: selected ? "var(--fg)" : "var(--fgMuted)",
          maxWidth: size + 8,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
        title={cat.label}
      >
        {cat.label}
      </span>
    </button>
  );
}
