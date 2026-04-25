import { requireUser } from "@/lib/session";
import { ImportScreen } from "@/components/screens/ImportScreen";

export default async function ImportPage() {
  const u = await requireUser();
  return <ImportScreen currency={u.currency} />;
}
