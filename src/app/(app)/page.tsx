import { requireUser } from "@/lib/session";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { listTransactions, categoriesForUser, accountsForUser } from "@/lib/repo";
import { llmHealth, userLlmConfig } from "@/lib/llm/client";

export default async function HomePage() {
  const u = await requireUser();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [txns, cats, accts, aiOnline] = await Promise.all([
    listTransactions(u.id, { from: monthStart, limit: 500 }),
    categoriesForUser(u.id),
    accountsForUser(u.id),
    llmHealth(userLlmConfig(u)),
  ]);

  return (
    <HomeScreen
      displayName={u.displayName}
      transactions={txns}
      categories={cats}
      accounts={accts}
      currency={u.currency}
      vizStyle={u.vizStyle}
      chipRep={u.chipRep}
      aiOnline={aiOnline}
    />
  );
}
