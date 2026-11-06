'use client';

import { formatCentsToBrl } from '@/lib/formatters';
import type { CategoryMetric } from '@/lib/appwrite/analytics';

interface CategorySalesChartProps {
  data: CategoryMetric[];
}

export function CategorySalesChart({ data }: CategorySalesChartProps) {
  const hasCategories = data.length > 0;
  const maxRevenue = hasCategories ? Math.max(...data.map((d) => d.revenue)) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Receita por Categoria
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Participação de cada seção do cardápio no faturamento
        </p>
      </div>

      {!hasCategories ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-xl bg-zinc-50/70 border border-dashed border-zinc-200 text-xs text-zinc-400">
          Nenhuma categoria com vendas no período selecionado.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((cat, index) => {
            const relativeWidth = maxRevenue > 0 ? (cat.revenue / maxRevenue) * 100 : 0;
            const isTop = index === 0;

            return (
              <div key={cat.categoryName} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-zinc-900 truncate">
                      {cat.categoryName}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-bold text-zinc-900">
                      {formatCentsToBrl(cat.revenue)}
                    </span>
                    <span className="text-[11px] text-zinc-400 ml-1.5 font-normal">
                      • {cat.quantity} {cat.quantity === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isTop ? 'bg-amber-500' : 'bg-zinc-800'
                    }`}
                    style={{ width: `${relativeWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
