import { requireUser } from "@/lib/session";
import { NewCategoryScreen } from "@/components/screens/NewCategoryScreen";

export default async function NewCategoryPage() {
  const u = await requireUser();
  return <NewCategoryScreen currency={u.currency} />;
}
