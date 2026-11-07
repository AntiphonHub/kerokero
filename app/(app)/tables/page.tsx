import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { ensureEstablishmentTables } from '@/lib/appwrite/tables';
import { TablesView } from '@/components/tables/tables-view';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Mesas & Comandas | Bempedi',
  description: 'Gestão de mesas, comandas digitais e chamados em tempo real.',
};

export default async function TablesPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  if (!establishment) {
    redirect('/onboarding/loja');
  }

  // Garante a existência das mesas de 1 até `tablesCount` de forma idempotente
  const tablesCount = establishment.tablesCount || 10;
  const initialTables = await ensureEstablishmentTables(establishment.$id, tablesCount);

  // Determina a URL base da aplicação para os QR Codes
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const appBaseUrl = `${protocol}://${host}`;

  return (
    <div className="p-4 md:p-8">
      <TablesView
        initialTables={initialTables}
        establishmentName={establishment.name}
        establishmentLogoUrl={null}
        appBaseUrl={appBaseUrl}
      />
    </div>
  );
}
