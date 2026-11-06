'use client';

import { formatCentsToBrl } from '@/lib/formatters';
import type { TopProductAnalytics } from '@/lib/appwrite/analytics';

interface TopItemsRankingProps {
  products: TopProductAnalytics[];
  totalRevenue: number;
}

export function TopItemsRanking({ products, totalRevenue }: TopItemsRankingProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
        <p className="text-xs text-zinc-400">Nenhum produto vendido no período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Produtos Mais Rentáveis
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Itens de maior impacto na receita do restaurante
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 w-12 text-center">#</th>
              <th className="px-4 py-2.5">Produto</th>
              <th className="px-4 py-2.5 text-center">Qtd Vendida</th>
              <th className="px-4 py-2.5 text-right">Faturamento</th>
              <th className="px-4 py-2.5 text-right">% do Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((item, index) => {
              const isTop1 = index === 0;
              const percentage =
                totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;

              return (
                <tr key={item.productId} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                        isTop1
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {item.productName}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-zinc-700">
                    {item.quantity} {item.quantity === 1 ? 'un.' : 'un.'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900 whitespace-nowrap">
                    {formatCentsToBrl(item.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-500">
                    {percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
