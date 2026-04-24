import { requireUser } from "@/lib/session";
import { accountsForUser, categoriesForUser, listTransactions } from "@/lib/repo";
import { TransactionsScreen } from "@/components/screens/TransactionsScreen";

export default async function TransactionsPage() {
  const u = await requireUser();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const [txns, cats, accts] = await Promise.all([
    listTransactions(u.id, { from, limit: 500 }),
    categoriesForUser(u.id),
    accountsForUser(u.id),
  ]);
  return (
    <TransactionsScreen
      initialTransactions={txns}
      categories={cats}
      accounts={accts}
      currency={u.currency}
    />
  );
}
