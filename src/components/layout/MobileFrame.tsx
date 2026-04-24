import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  showFrame?: boolean;
}

export function MobileFrame({ children, showFrame = false }: Props) {
  if (!showFrame) {
    return <div className="mx-auto min-h-dvh w-full max-w-[420px]">{children}</div>;
  }
  return (
    <div className="mx-auto flex min-h-dvh items-center justify-center p-6">
      <div
        className="relative overflow-hidden bg-bg"
        style={{
          width: 390,
          height: 844,
          borderRadius: 48,
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.5), 0 0 0 10px rgba(30,30,35,0.9), 0 0 0 11px rgba(60,60,70,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
