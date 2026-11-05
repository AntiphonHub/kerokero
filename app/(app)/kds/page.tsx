import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { listKitchenOrders } from '@/lib/appwrite/orders';
import { KdsView } from '@/components/kds/kds-view';

export const metadata = {
  title: 'Cozinha & KDS | KeroKero',
  description: 'Quadro Kanban de produção e pedidos em tempo real.',
};

export default async function KdsPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  if (!establishment) {
    redirect('/onboarding/loja');
  }

  const initialOrders = await listKitchenOrders(establishment.$id);

  return (
    <div className="p-4 md:p-8">
      <KdsView
        initialOrders={initialOrders}
        establishmentId={establishment.$id}
      />
    </div>
  );
}
