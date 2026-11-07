import { CircleDollarSign, QrCode, CreditCard, Receipt } from 'lucide-react';
import { formatCentsToBrl } from '@/lib/formatters';
import type { HistorySummary } from '@/lib/appwrite/orders-history';

interface HistorySummaryCardsProps {
  summary: HistorySummary;
}

export function HistorySummaryCards({ summary }: HistorySummaryCardsProps) {
  const pixPercentage =
    summary.totalRevenue > 0
      ? Math.round((summary.pixAsaasRevenue / summary.totalRevenue) * 100)
      : 0;

  const posPercentage =
    summary.totalRevenue > 0
      ? Math.round((summary.posMachineRevenue / summary.totalRevenue) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Geral Faturado (com destaque em âmbar) */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Total Faturado
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <CircleDollarSign className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatCentsToBrl(summary.totalRevenue)}
        </p>
        <p className="mt-1.5 text-xs text-zinc-500">
          Soma das mesas finalizadas no período
        </p>
      </div>

      {/* 2. Recebido via PIX */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            PIX (Digital)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <QrCode className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatCentsToBrl(summary.pixAsaasRevenue)}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-700">{pixPercentage}%</span>
          <span>liquidado via PIX</span>
        </div>
      </div>

      {/* 3. Recebido na Maquininha / Loja */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Maquininha / Loja
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatCentsToBrl(summary.posMachineRevenue)}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-700">{posPercentage}%</span>
          <span>recebido presencialmente</span>
        </div>
      </div>

      {/* 4. Comandas Finalizadas */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Comandas Finalizadas
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {summary.sessionsCount}
        </p>
        <p className="mt-1.5 text-xs text-zinc-500">
          {summary.itemsCount} {summary.itemsCount === 1 ? 'item produzido' : 'itens produzidos'}
        </p>
      </div>
    </div>
  );
}
