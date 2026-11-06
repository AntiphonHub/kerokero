import { TrendingUp, Split, Receipt, Clock } from 'lucide-react';
import { formatCentsToBrl } from '@/lib/formatters';
import type { AnalyticsKPIs } from '@/lib/appwrite/analytics';

interface AnalyticsKPIsProps {
  kpis: AnalyticsKPIs;
}

export function AnalyticsKPIs({ kpis }: AnalyticsKPIsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Faturamento Bruto Total (com barra superior âmbar) */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Faturamento Realizado
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            {formatCentsToBrl(kpis.totalRevenue)}
          </p>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {kpis.totalSessions} {kpis.totalSessions === 1 ? 'comanda fechada' : 'comandas fechadas'}
        </p>
      </div>

      {/* 2. Mix de Pagamento (PIX Asaas vs Maquininha) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Mix de Pagamento
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Split className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                PIX Asaas ({kpis.pixPercentage}%)
              </span>
              <span className="font-bold text-zinc-900">
                {formatCentsToBrl(kpis.pixAsaasRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-800" />
                Maquininha ({kpis.posPercentage}%)
              </span>
              <span className="font-bold text-zinc-900">
                {formatCentsToBrl(kpis.posMachineRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Barra proporcional dos canais */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 flex">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${kpis.pixPercentage}%` }}
          />
          <div
            className="h-full bg-zinc-800 transition-all duration-300"
            style={{ width: `${kpis.posPercentage}%` }}
          />
        </div>
      </div>

      {/* 3. Ticket Médio Duplo (Mesa & Cliente) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ticket Médio
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            {formatCentsToBrl(kpis.averageTicketPerTable)}
          </p>
        </div>
        <div className="mt-2 text-xs text-zinc-500 flex items-center justify-between">
          <span>Por cliente:</span>
          <span className="font-bold text-zinc-900">
            {formatCentsToBrl(kpis.averageTicketPerCustomer)}
          </span>
        </div>
      </div>

      {/* 4. Tempo Médio de Permanência */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Permanência na Mesa
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            {kpis.formattedStayDuration}
          </p>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Giro médio da comanda no salão
        </p>
      </div>
    </div>
  );
}
