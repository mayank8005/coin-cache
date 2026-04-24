import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { UnauthorizedError } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  try {
    await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login");
    throw err;
  }
  return <>{children}</>;
}
