import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { listTransactions, categoriesForUser, accountsForUser } from "@/lib/repo";
import { llmHealth } from "@/lib/llm/client";

export default async function HomePage() {
  const u = await requireUser();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [txns, cats, accts, user, aiOnline] = await Promise.all([
    listTransactions(u.id, { from: monthStart, limit: 500 }),
    categoriesForUser(u.id),
    accountsForUser(u.id),
    prisma.user.findUnique({ where: { id: u.id }, select: { displayName: true } }),
    llmHealth(),
  ]);

  return (
    <HomeScreen
      displayName={user?.displayName ?? u.displayName}
      transactions={txns}
      categories={cats}
      accounts={accts}
      currency={u.currency}
      vizStyle={u.vizStyle}
      aiOnline={aiOnline}
    />
  );
}
