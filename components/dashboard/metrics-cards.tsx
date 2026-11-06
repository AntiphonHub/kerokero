import { TrendingUp, Receipt, UtensilsCrossed, LayoutGrid } from 'lucide-react';
import { formatCentsToBrl } from '@/lib/formatters';
import type { DashboardMetrics, LiveStatusMetrics, DashboardRange } from '@/lib/appwrite/dashboard';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  liveStatus: LiveStatusMetrics;
  range: DashboardRange;
}

export function MetricsCards({ metrics, liveStatus, range }: MetricsCardsProps) {
  const rangeLabels: Record<DashboardRange, string> = {
    today: 'hoje',
    yesterday: 'ontem',
    '7d': 'últimos 7 dias',
  };

  const periodLabel = rangeLabels[range] || 'período';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Faturamento Bruto (Destaque Principal em Âmbar) */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Faturamento Bruto
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatCentsToBrl(metrics.totalRevenue)}
        </p>
        <p className="mt-1.5 text-xs text-zinc-500">
          Vendas brutas em {periodLabel}
        </p>
      </div>

      {/* 2. Ticket Médio */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Ticket Médio
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50/60 text-amber-600 border border-amber-200/40">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatCentsToBrl(metrics.averageTicket)}
        </p>
        <p className="mt-1.5 text-xs text-zinc-500">
          Por comanda atendida no período
        </p>
      </div>

      {/* 3. Comandas Atendidas */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Comandas Atendidas
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {metrics.uniqueSessionsCount}
        </p>
        <p className="mt-1.5 text-xs text-zinc-500">
          {metrics.totalItemsCount} {metrics.totalItemsCount === 1 ? 'item produzido' : 'itens produzidos'}
        </p>
      </div>

      {/* 4. Ocupação do Salão */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ocupação do Salão
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <LayoutGrid className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            {liveStatus.occupiedTables}{' '}
            <span className="text-base font-normal text-zinc-400">/ {liveStatus.totalTables} mesas</span>
          </p>
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${liveStatus.occupancyRate}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            {liveStatus.pendingServiceCallsCount > 0 ? (
              <span className="font-semibold text-amber-600">
                {liveStatus.pendingServiceCallsCount}{' '}
                {liveStatus.pendingServiceCallsCount === 1 ? 'chamado aguardando' : 'chamados aguardando'}
              </span>
            ) : (
              `${liveStatus.occupancyRate}% das mesas ocupadas agora`
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
