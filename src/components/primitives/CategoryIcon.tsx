import type { CategoryIconId } from "@/constants/categories";

interface Props {
  id: CategoryIconId | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const COMMON = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CategoryIcon({ id, size = 20, color = "currentColor", strokeWidth = 1.6 }: Props) {
  const common = { ...COMMON, stroke: color, strokeWidth };
  switch (id) {
    case "food":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <path d="M8 3v8a3 3 0 0 1-6 0V3M5 3v18M19 3c-2 0-3 2-3 5s1 5 3 5v8" />
        </svg>
      );
    case "rent":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <path d="M3 11l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "groc":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <path d="M3 4h2l2 12h12l2-8H7M8 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </svg>
      );
    case "trans":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <rect x="4" y="4" width="16" height="14" rx="2" />
          <path d="M4 13h16M8 18v2M16 18v2" />
          <circle cx="8.5" cy="15.5" r="0.8" fill={color} stroke="none" />
          <circle cx="15.5" cy="15.5" r="0.8" fill={color} stroke="none" />
        </svg>
      );
    case "bills":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "fun":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2" />
          <circle cx="9" cy="10" r="0.9" fill={color} stroke="none" />
          <circle cx="15" cy="10" r="0.9" fill={color} stroke="none" />
        </svg>
      );
    case "health":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "kids":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      );
    case "home":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <path d="M3 12l9-8 9 8M5 10v10h14V10" />
        </svg>
      );
    case "gifts":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <rect x="3" y="8" width="18" height="13" rx="1" />
          <path d="M3 12h18M12 8v13M8.5 8c-1.5 0-2.5-1-2.5-2.5S7 3 8.5 3c2 0 3.5 5 3.5 5s1.5-5 3.5-5S18 4 18 5.5 17 8 15.5 8" />
        </svg>
      );
    case "subs":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
        </svg>
      );
    case "misc":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <circle cx="5" cy="12" r="1.5" fill={color} stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
          <circle cx="19" cy="12" r="1.5" fill={color} stroke="none" />
        </svg>
      );
  }
}
