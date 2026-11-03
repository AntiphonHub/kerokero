'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  Plus,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { ProductDocument, CategoryDocument } from '@/lib/appwrite/products';
import { filterProducts, getEffectiveProductPrice } from '@/lib/utils/menu';
import { formatCentsToBrl } from '@/lib/formatters';
import { ProductModal } from './product-modal';
import { CartBottomBar } from './cart-bottom-bar';
import { CartSheet } from './cart-sheet';

export interface MenuViewProps {
  products: ProductDocument[];
  categories: CategoryDocument[];
  tableToken: string;
  tableLabel?: string;
  establishmentName?: string;
  participantName?: string;
  onOrderSuccess?: () => void;
  bottomBarOffset?: boolean;
}

export function MenuView({
  products,
  categories,
  tableToken,
  tableLabel,
  establishmentName,
  participantName,
  onOrderSuccess,
  bottomBarOffset = false,
}: MenuViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDocument | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSentToast, setOrderSentToast] = useState(false);

  // Filter products based on active category and search input
  const filteredProducts = filterProducts(products, selectedCategoryId, searchQuery);

  const handleOrderSuccess = () => {
    setOrderSentToast(true);
    onOrderSuccess?.();
    setTimeout(() => {
      setOrderSentToast(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Table & Session Header Banner */}
      <div className="p-4 bg-white border-b border-zinc-200/80">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              {establishmentName || 'Cardápio Digital'}
            </span>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight truncate">
              {tableLabel || 'Sua Mesa'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            <CheckCircle2 className="size-3.5" />
            <span>Comanda Ativa</span>
          </div>
        </div>

        {participantName && (
          <p className="text-xs text-zinc-500 mt-1">
            Conectado como <strong className="text-zinc-800">{participantName}</strong>
          </p>
        )}

        {/* Search Bar */}
        <div className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pratos, bebidas e porções..."
            className="w-full h-11 pl-9 pr-9 text-xs rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Order Sent Notification Banner */}
      {orderSentToast && (
        <div className="m-4 p-3.5 rounded-2xl bg-zinc-900 text-white flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Pedido enviado com sucesso!</p>
              <p className="text-[11px] text-zinc-400">A cozinha já recebeu sua comanda.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOrderSentToast(false)}
            aria-label="Fechar notificação"
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Horizontal Category Carousel */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {/* "Todos" pill */}
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            Todos ({products.filter((p) => p.isActive !== false).length})
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.$id && p.isActive !== false,
            ).length;
            const isSelected = selectedCategoryId === cat.$id;

            return (
              <button
                key={cat.$id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.$id)}
                className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products List */}
      <div className="p-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="size-14 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 mb-3">
              <UtensilsCrossed className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Nenhum item encontrado</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Tente selecionar outra categoria ou buscar por outros ingredientes.
            </p>
            {(searchQuery || selectedCategoryId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const effectivePrice = getEffectiveProductPrice(product);
            const isHappyHour =
              product.happyHourPrice != null && product.happyHourPrice < product.price;
            const hasAddons = product.addons && product.addons.length > 0;

            return (
              <div
                key={product.$id}
                onClick={() => setSelectedProduct(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedProduct(product);
                  }
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex gap-3.5 cursor-pointer active:scale-[0.99]"
              >
                {/* Left/Middle Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight leading-snug">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-zinc-900">
                        {formatCentsToBrl(effectivePrice)}
                      </span>
                      {isHappyHour && (
                        <span className="text-[11px] text-zinc-400 line-through">
                          {formatCentsToBrl(product.price)}
                        </span>
                      )}
                    </div>

                    {hasAddons && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                        Personalizável
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Image Thumbnail or Action Button */}
                <div className="flex flex-col items-end justify-between shrink-0">
                  {product.imageUrl ? (
                    <div className="size-20 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="size-20 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-300">
                      <UtensilsCrossed className="size-6" />
                    </div>
                  )}

                  <div className="size-8 mt-2 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs hover:bg-zinc-800 transition-colors">
                    <Plus className="size-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Bar when cart has items */}
      <CartBottomBar
        tableToken={tableToken}
        onOpenCart={() => setIsCartOpen(true)}
        className={bottomBarOffset ? 'bottom-20' : 'bottom-4'}
      />

      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableToken={tableToken}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}
