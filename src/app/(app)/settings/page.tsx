import { requireUser } from "@/lib/session";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

export default async function SettingsPage() {
  const u = await requireUser();
  return (
    <SettingsScreen
      displayName={u.displayName}
      paletteId={u.paletteId}
      vizStyle={u.vizStyle}
      chipStyle={u.chipStyle}
      chipRep={u.chipRep}
      currency={u.currency}
      llmBaseUrl={u.llmBaseUrl}
      llmApiKey={u.llmApiKey}
      llmModel={u.llmModel}
    />
  );
}
