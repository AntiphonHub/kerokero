'use client';

import { useMemo, useState } from 'react';
import { OrderDocument } from '@/lib/appwrite/orders';
import { aggregateKitchenItems } from '@/lib/utils/kds';
import { CookingPot, ChevronDown, ChevronUp } from 'lucide-react';

interface KdsSummaryBarProps {
  orders: OrderDocument[];
}

export function KdsSummaryBar({ orders }: KdsSummaryBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = useMemo(() => aggregateKitchenItems(orders), [orders]);

  if (items.length === 0) {
    return null;
  }

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const displayedItems = isExpanded ? items : items.slice(0, 6);
  const hasMore = items.length > 6;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-3 shadow-xs mb-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <CookingPot className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Resumo de Produção
          </span>
          <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'} a preparar
          </span>
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Recolher</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Ver todos ({items.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {displayedItems.map((item) => (
          <div
            key={item.productName}
            className="inline-flex items-center gap-1.5 bg-zinc-100/90 border border-zinc-200/60 rounded-lg px-2.5 py-1 text-xs text-zinc-900"
          >
            <span className="font-bold text-amber-600">{item.quantity}x</span>
            <span className="font-medium truncate max-w-[160px] md:max-w-[220px]">
              {item.productName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
