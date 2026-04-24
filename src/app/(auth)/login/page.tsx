import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(sp.next && sp.next.startsWith("/") ? sp.next : "/");
  return <LoginForm next={sp.next} error={sp.error} />;
}
