import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { getDashboardData } from '@/lib/appwrite/dashboard';
import { PeriodSelector } from '@/components/dashboard/period-selector';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { LiveServiceCalls } from '@/components/dashboard/live-service-calls';

export const metadata: Metadata = {
  title: 'Dashboard | Bempedi',
  description: 'Painel operacional do lojista',
};

export const instant = false;

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await connection();
  const user = await getLoggedInUser();
  const resolvedSearchParams = await searchParams;
  const range = resolvedSearchParams?.range;

  const establishment = user ? await getEstablishmentByUserId(user.$id) : null;
  const dashboardData = establishment
    ? await getDashboardData(establishment.$id, range)
    : null;

  if (!dashboardData) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Olá, {user?.name || 'Lojista'}!
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Estabelecimento não configurado ou em processo de abertura.
          </p>
        </div>
      </div>
    );
  }

  const chartTitle =
    dashboardData.range === '7d' ? 'Vendas por Dia' : 'Vendas por Hora';

  const chartSubtitle =
    dashboardData.range === '7d'
      ? 'Faturamento bruto acumulado nos últimos 7 dias'
      : `Distribuição horária do faturamento (${dashboardData.range === 'today' ? 'Hoje' : 'Ontem'})`;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho com Saudação e Seletor de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Olá, {user?.name || 'Lojista'}!
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Métricas operacionais e financeiras de {establishment?.name || 'seu negócio'}.
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <PeriodSelector currentRange={dashboardData.range} />
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <MetricsCards
        metrics={dashboardData.metrics}
        liveStatus={dashboardData.liveStatus}
        range={dashboardData.range}
      />

      {/* Seção de Gráficos em Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart
          data={dashboardData.salesOverTime}
          title={chartTitle}
          subtitle={chartSubtitle}
        />
        <TopProductsChart data={dashboardData.topProducts} />
      </div>

      {/* Seção de Chamados Recentes Ao Vivo */}
      <LiveServiceCalls initialCalls={dashboardData.recentServiceCalls} />
    </div>
  );
}
