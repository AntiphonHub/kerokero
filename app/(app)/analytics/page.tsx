import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { getAnalyticsData, type AnalyticsRange } from '@/lib/appwrite/analytics';
import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import { AnalyticsKPIs } from '@/components/analytics/analytics-kpis';
import { ChannelSalesChart } from '@/components/analytics/channel-sales-chart';
import { CategorySalesChart } from '@/components/analytics/category-sales-chart';
import { TopItemsRanking } from '@/components/analytics/top-items-ranking';

export const metadata: Metadata = {
  title: 'Métricas & Vendas | KeroKero',
  description: 'Inteligência de negócio, canais de faturamento e desempenho de cardápio.',
};

export const instant = false;

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
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
  const data = await getAnalyticsData(establishment.$id, resolvedParams?.range);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho e Seletor de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Métricas & Vendas
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Inteligência de faturamento, conciliação por canal e performance de cardápio.
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <AnalyticsFilters currentRange={data.range} />
        </div>
      </div>

      {/* Cards de KPIs Principais */}
      <AnalyticsKPIs kpis={data.kpis} />

      {/* Gráficos em Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelSalesChart data={data.channelSalesOverTime} />
        <CategorySalesChart data={data.categoryDistribution} />
      </div>

      {/* Ranking de Produtos Mais Rentáveis */}
      <TopItemsRanking
        products={data.topProducts}
        totalRevenue={data.kpis.totalRevenue}
      />
    </div>
  );
}
