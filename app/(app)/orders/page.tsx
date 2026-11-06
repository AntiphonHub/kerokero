import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import {
  getOrdersHistoryData,
  type HistoryRange,
  type HistoryPaymentFilter,
  type HistoryTab,
} from '@/lib/appwrite/orders-history';
import { OrdersHistoryView } from '@/components/orders/orders-history-view';

export const metadata: Metadata = {
  title: 'Histórico de Pedidos | KeroKero',
  description: 'Auditoria e conferência de caixa de comandas e itens finalizados.',
};

export const instant = false;

interface OrdersPageProps {
  searchParams: Promise<{
    tab?: string;
    range?: string;
    payment?: string;
    search?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await connection();
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  if (!establishment) {
    redirect('/onboarding/loja');
  }

  const resolvedParams = await searchParams;

  const data = await getOrdersHistoryData(establishment.$id, {
    tab: resolvedParams?.tab as HistoryTab,
    range: resolvedParams?.range as HistoryRange,
    paymentMethod: resolvedParams?.payment as HistoryPaymentFilter,
    search: resolvedParams?.search,
  });

  return <OrdersHistoryView initialData={data} />;
}
