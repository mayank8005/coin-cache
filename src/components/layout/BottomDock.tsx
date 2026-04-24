"use client";

import { useRouter } from "next/navigation";
import { PlusMinusButton } from "@/components/primitives/PlusMinusButton";

export function BottomDock() {
  const router = useRouter();
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex justify-center pb-6">
      <div className="pointer-events-auto flex items-center gap-4">
        <PlusMinusButton kind="minus" size={64} onClick={() => router.push("/add?kind=expense")} />
        <PlusMinusButton kind="plus" size={72} onClick={() => router.push("/add?kind=income")} />
      </div>
    </div>
  );
}
