'use client';

import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { formatCentsToBrl } from '@/lib/formatters';

export interface CartBottomBarProps {
  tableToken?: string;
  onOpenCart: () => void;
}

export function CartBottomBar({ tableToken, onOpenCart }: CartBottomBarProps) {
  const { itemCount, totalCents } = useCartStore(tableToken);

  if (itemCount <= 0) {
    return null;
  }

  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} itens`;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 max-w-lg mx-auto">
      <button
        type="button"
        onClick={onOpenCart}
        aria-label="Abrir carrinho de pedidos"
        className="w-full min-h-[56px] bg-zinc-900 text-white rounded-2xl px-4 py-3 shadow-xl border border-zinc-800 flex items-center justify-between hover:bg-zinc-800 active:scale-[0.99] transition-all duration-150 animate-in slide-in-from-bottom-4"
      >
        {/* Left: Bag Icon & Item count */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShoppingBag className="size-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {itemLabel} no pedido
            </span>
            <span className="text-sm font-bold text-white tracking-tight">
              {formatCentsToBrl(totalCents)}
            </span>
          </div>
        </div>

        {/* Right: Action CTA */}
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
          <span>Ver Comanda</span>
          <ChevronRight className="size-4" />
        </div>
      </button>
    </div>
  );
}
