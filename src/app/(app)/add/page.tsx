import { requireUser } from "@/lib/session";
import { accountsForUser, categoriesForUser } from "@/lib/repo";
import { AddScreen } from "@/components/screens/AddScreen";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const u = await requireUser();
  const sp = await searchParams;
  const kind = sp.kind === "income" ? "income" : "expense";
  const [cats, accts] = await Promise.all([categoriesForUser(u.id), accountsForUser(u.id)]);

  return (
    <AddScreen
      kind={kind}
      categories={cats}
      accounts={accts}
      currency={u.currency}
      chipStyle={u.chipStyle}
      chipRep={u.chipRep}
      llmBaseUrl={u.llmBaseUrl}
      llmApiKey={u.llmApiKey}
      llmModel={u.llmModel}
    />
  );
}
