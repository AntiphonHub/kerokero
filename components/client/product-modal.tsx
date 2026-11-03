'use client';

import React, { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { ProductDocument } from '@/lib/appwrite/products';
import type { ProductAddon } from '@/lib/schemas/product';
import { cartStore } from '@/lib/store/cart-store';
import {
  getEffectiveProductPrice,
  calculateCustomizedUnitPrice,
  calculateItemTotal,
} from '@/lib/utils/menu';
import { formatCentsToBrl } from '@/lib/formatters';

export interface ProductModalProps {
  product: ProductDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProductModalInnerProps {
  product: ProductDocument;
  onClose: () => void;
}

function ProductModalInner({ product, onClose }: ProductModalInnerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const basePrice = getEffectiveProductPrice(product);
  const availableAddons = product.addons || [];
  const selectedAddons = availableAddons.filter((a) => selectedAddonIds.includes(a.id));
  const unitPrice = calculateCustomizedUnitPrice(basePrice, selectedAddons);
  const totalPrice = calculateItemTotal(unitPrice, quantity);

  const toggleAddon = (addon: ProductAddon) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addon.id) ? prev.filter((id) => id !== addon.id) : [...prev, addon.id],
    );
  };

  const handleIncrement = () => {
    setQuantity((q) => q + 1);
  };

  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAddToCart = () => {
    const selectedOptionNames = selectedAddons.map((a) => a.name);

    cartStore.addItem({
      productId: product.$id,
      name: product.name,
      priceCents: unitPrice,
      quantity,
      notes: notes.trim() || undefined,
      selectedOptions: selectedOptionNames.length > 0 ? selectedOptionNames : undefined,
    });

    onClose();
  };

  return (
    <DialogPrimitive.Popup className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl pointer-events-auto border-t border-zinc-200/80 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
      {/* Modal Header Bar with Close Button */}
      <div className="relative flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-100">
        <div className="h-1 w-12 bg-zinc-300 rounded-full mx-auto absolute top-2 inset-x-0" />
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2">
          {product.categoryName || 'Detalhes do Item'}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="size-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors focus:outline-hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Product Image (if available) */}
        {product.imageUrl && (
          <div className="w-full h-44 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-base font-bold text-zinc-900">
              {formatCentsToBrl(basePrice)}
            </span>
            {product.happyHourPrice != null && product.happyHourPrice < product.price && (
              <span className="text-xs text-zinc-400 line-through">
                {formatCentsToBrl(product.price)}
              </span>
            )}
          </div>
        </div>

        {/* Complements / Addons Section */}
        {availableAddons.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-100">
            <label className="text-xs font-semibold text-zinc-900 block">
              Adicionais e Complementos
            </label>
            <div className="space-y-2">
              {availableAddons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="size-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-medium truncate">{addon.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 shrink-0 ml-2">
                      +{formatCentsToBrl(addon.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions / Notes */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <label htmlFor="notes-input" className="text-xs font-semibold text-zinc-900">
              Observações para a cozinha
            </label>
            <span className="text-[11px] text-zinc-400">{notes.length}/500</span>
          </div>
          <textarea
            id="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="Ex: Sem cebola, molho à parte, bem passado..."
            rows={2}
            className="w-full text-xs rounded-xl border border-zinc-200 p-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none"
          />
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-4 bg-zinc-50 border-t border-zinc-200/80 flex items-center gap-3">
        {/* Quantity Stepper (min 44px touch target) */}
        <div className="flex items-center border border-zinc-300 bg-white rounded-xl h-12 px-2 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            aria-label="Diminuir quantidade"
            className="size-8 rounded-lg flex items-center justify-center text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-zinc-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            aria-label="Aumentar quantidade"
            className="size-8 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Add to Cart Button (min 44px) */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 h-12 rounded-xl bg-zinc-900 text-white font-semibold text-sm flex items-center justify-between px-4 hover:bg-zinc-800 active:bg-black transition-colors shadow-xs"
        >
          <span>Adicionar ao Pedido</span>
          <span className="font-bold text-amber-400">{formatCentsToBrl(totalPrice)}</span>
        </button>
      </div>
    </DialogPrimitive.Popup>
  );
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  if (!product) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200" />
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
          <ProductModalInner key={product.$id} product={product} onClose={onClose} />
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
