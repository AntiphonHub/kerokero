import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { SettingsView } from '@/components/settings/settings-view';
import type { SettingsTabId } from '@/components/settings/settings-nav';

export const metadata = {
  title: 'Configurações | KeroKero',
  description: 'Gerenciamento do restaurante, capacidade do salão, senhas e assinatura.',
};

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  if (!establishment) {
    redirect('/onboarding/loja');
  }

  const resolvedParams = await searchParams;
  const initialTab = (resolvedParams.tab as SettingsTabId) || 'store';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <SettingsView establishment={establishment} initialTab={initialTab} />
    </div>
  );
}
