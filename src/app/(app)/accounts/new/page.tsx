import { requireUser } from "@/lib/session";
import { NewAccountScreen } from "@/components/screens/NewAccountScreen";

export default async function NewAccountPage() {
  await requireUser();
  return <NewAccountScreen />;
}
