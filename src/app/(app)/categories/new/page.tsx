import { requireUser } from "@/lib/session";
import { NewCategoryScreen } from "@/components/screens/NewCategoryScreen";

export default async function NewCategoryPage() {
  await requireUser();
  return <NewCategoryScreen />;
}
