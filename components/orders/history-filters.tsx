'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Layers, ListOrdered } from 'lucide-react';
import type { HistoryRange, HistoryPaymentFilter, HistoryTab } from '@/lib/appwrite/orders-history';

interface HistoryFiltersProps {
  currentTab: HistoryTab;
  currentRange: HistoryRange;
  currentPayment: HistoryPaymentFilter;
  currentSearch: string;
}

const ranges: Array<{ id: HistoryRange; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
];

const paymentMethods: Array<{ id: HistoryPaymentFilter; label: string }> = [
  { id: 'all', label: 'Todos os Meios' },
  { id: 'pix_asaas', label: 'PIX' },
  { id: 'pos_card', label: 'Maquininha' },
  { id: 'cash', label: 'Dinheiro' },
];

export function HistoryFilters({
  currentTab,
  currentRange,
  currentPayment,
  currentSearch,
}: HistoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === 'all' || (key === 'range' && value === 'today') || (key === 'tab' && value === 'sessions')) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Alternador de Abas Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200">
        <div className="inline-flex items-center rounded-xl bg-zinc-200/70 p-1 border border-zinc-200 shadow-2xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateParam('tab', 'sessions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              currentTab === 'sessions'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Comandas & Contas
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateParam('tab', 'items')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              currentTab === 'items'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            Itens Produzidos
          </button>
        </div>

        {/* 2. Seletor de Período Temporal */}
        <div className="inline-flex items-center rounded-xl bg-zinc-200/70 p-1 border border-zinc-200 shadow-2xs self-start sm:self-auto">
          {ranges.map((r) => {
            const isActive = currentRange === r.id;
            return (
              <button
                key={r.id}
                type="button"
                disabled={isPending}
                onClick={() => updateParam('range', r.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Linha Secundária: Filtro por Método de Pagamento e Busca Textual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filtro de Pagamento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {paymentMethods.map((pm) => {
            const isActive = currentPayment === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                disabled={isPending}
                onClick={() => updateParam('payment', pm.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-semibold'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {pm.label}
              </button>
            );
          })}
        </div>

        {/* Busca por Mesa ou Cliente */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Buscar por mesa ou cliente..."
            onChange={(e) => {
              const val = e.target.value;
              // Debounce simplificado
              const timer = setTimeout(() => {
                updateParam('search', val || null);
              }, 300);
              return () => clearTimeout(timer);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
}
