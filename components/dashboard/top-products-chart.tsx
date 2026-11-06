'use client';

import { formatCentsToBrl } from '@/lib/formatters';
import type { TopProductMetric } from '@/lib/appwrite/dashboard';

interface TopProductsChartProps {
  data: TopProductMetric[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const hasProducts = data.length > 0;
  const maxRevenue = hasProducts ? Math.max(...data.map((d) => d.revenue)) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Mais Vendidos por Faturamento
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Top 5 itens que mais geraram receita no período
        </p>
      </div>

      {!hasProducts ? (
        <div className="h-64 flex flex-col items-center justify-center rounded-xl bg-zinc-50/70 border border-dashed border-zinc-200 text-xs text-zinc-400">
          Nenhum item vendido no período selecionado.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            const isTop1 = index === 0;

            return (
              <div key={item.productId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                        isTop1
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`truncate ${isTop1 ? 'font-bold text-zinc-900' : 'font-medium text-zinc-800'}`}>
                      {item.productName}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-bold text-zinc-900">
                      {formatCentsToBrl(item.revenue)}
                    </span>
                    <span className="text-[11px] text-zinc-400 ml-1.5 font-normal">
                      ({item.quantity} {item.quantity === 1 ? 'un.' : 'un.'})
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isTop1 ? 'bg-amber-500' : 'bg-zinc-800'
                    }`}
                    style={{ width: `${percentage}%` }}
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
