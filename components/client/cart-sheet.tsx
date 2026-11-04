'use client';

import React, { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { submitOrderAction } from '@/actions/client';
import {
  mapCartItemsToOrderInput,
  resolveCartUpsells,
  getEffectiveProductPrice,
} from '@/lib/utils/menu';
import { formatCentsToBrl } from '@/lib/formatters';
import type { ProductDocument } from '@/lib/appwrite/products';

export interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableToken?: string;
  onOrderSuccess?: () => void;
  products?: ProductDocument[];
  onSelectProduct?: (product: ProductDocument) => void;
  isHappyHour?: boolean;
}

export function CartSheet({
  isOpen,
  onClose,
  tableToken,
  onOrderSuccess,
  products = [],
  onSelectProduct,
  isHappyHour = false,
}: CartSheetProps) {
  const { items, addItem, removeItem, updateQuantity, clearCart, totalCents, itemCount } =
    useCartStore(tableToken);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedUpsellId, setAddedUpsellId] = useState<string | null>(null);

  const cartProductIds = items.map((i) => i.productId);
  const cartUpsells = resolveCartUpsells(cartProductIds, products);

  const handleAddUpsell = (item: ProductDocument) => {
    if (item.addons && item.addons.length > 0) {
      onClose();
      if (onSelectProduct) {
        onSelectProduct(item);
      }
    } else {
      addItem({
        productId: item.$id,
        name: item.name,
        priceCents: getEffectiveProductPrice(item, isHappyHour),
        quantity: 1,
      });
      setAddedUpsellId(item.$id);
      setTimeout(() => {
        setAddedUpsellId((prev) => (prev === item.$id ? null : prev));
      }, 1500);
    }
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderPayload = mapCartItemsToOrderInput(items);
      const res = await submitOrderAction(orderPayload);

      if (!res.success) {
        setErrorMessage(res.message || 'Não foi possível enviar o pedido.');
        setIsSubmitting(false);
        return;
      }

      // Success: clear cart store and trigger success view
      clearCart();
      setIsSuccess(true);
      onOrderSuccess?.();

      // Automatically close after a short interval
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar o pedido.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200" />
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
          <DialogPrimitive.Popup className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl pointer-events-auto border-t border-zinc-200/80 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-100">
              <div className="h-1 w-12 bg-zinc-300 rounded-full mx-auto absolute top-2 inset-x-0" />
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight pt-1">
                  Seu Pedido
                </h2>
                <p className="text-[11px] text-zinc-500">
                  {itemCount} {itemCount === 1 ? 'item selecionado' : 'itens selecionados'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {items.length > 0 && !isSuccess && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-zinc-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Fechar comanda"
                  className="size-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors focus:outline-hidden"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            {isSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-200">
                <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  Pedido Enviado para a Cozinha!
                </h3>
                <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
                  Seus itens já foram recebidos e estão sendo preparados pela nossa equipe.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="size-14 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 mb-3">
                  <ShoppingBag className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">Seu pedido está vazio</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Escolha itens do cardápio para adicionar à sua comanda.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-zinc-100">
                {errorMessage && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {items.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-zinc-900 block truncate">
                          {item.name}
                        </span>
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="text-[11px] text-zinc-500 mt-0.5 space-x-1">
                            <span>Adicionais:</span>
                            <span className="font-medium text-zinc-700">
                              {item.selectedOptions.join(', ')}
                            </span>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-zinc-500 italic mt-0.5">
                            Obs: &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-zinc-900 block">
                          {formatCentsToBrl(item.priceCents * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-zinc-400">
                            {formatCentsToBrl(item.priceCents)} un.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Remove */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] text-zinc-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Remover</span>
                      </button>

                      <div className="flex items-center border border-zinc-200 bg-zinc-50 rounded-lg h-8 px-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Diminuir quantidade"
                          className="size-6 rounded flex items-center justify-center text-zinc-600 hover:bg-white active:bg-zinc-200 transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar quantidade"
                          className="size-6 rounded flex items-center justify-center text-zinc-600 hover:bg-white active:bg-zinc-200 transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Upsell Suggestions in Cart */}
                {cartUpsells.length > 0 && (
                  <div className="pt-3 pb-1 border-t border-zinc-100 space-y-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                      Sugestões para o seu pedido
                    </span>

                    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
                      {cartUpsells.map((upsellItem) => {
                        const itemPrice = getEffectiveProductPrice(upsellItem, isHappyHour);
                        const hasAddons = upsellItem.addons && upsellItem.addons.length > 0;
                        const isAdded = addedUpsellId === upsellItem.$id;

                        return (
                          <div
                            key={upsellItem.$id}
                            className="shrink-0 w-32 p-2 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex flex-col justify-between snap-start"
                          >
                            <div>
                              {upsellItem.imageUrl ? (
                                <div className="w-full h-16 rounded-lg overflow-hidden bg-zinc-100 mb-1.5 border border-zinc-200/60">
                                  <img
                                    src={upsellItem.imageUrl}
                                    alt={upsellItem.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-12 rounded-lg bg-zinc-100 border border-zinc-200/60 mb-1.5 flex items-center justify-center text-zinc-400">
                                  <UtensilsCrossed className="size-4" />
                                </div>
                              )}
                              <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1 leading-tight">
                                {upsellItem.name}
                              </h4>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-zinc-900">
                                {formatCentsToBrl(itemPrice)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAddUpsell(upsellItem)}
                                className={`size-7 rounded-lg flex items-center justify-center active:scale-95 transition-all shadow-2xs ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                }`}
                                title={hasAddons ? 'Personalizar e adicionar' : 'Adicionar ao pedido'}
                              >
                                {isAdded ? (
                                  <Check className="size-4 stroke-[3]" />
                                ) : (
                                  <Plus className="size-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer with Total and Submit Button */}
            {!isSuccess && items.length > 0 && (
              <div className="p-4 bg-zinc-50 border-t border-zinc-200/80 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Total deste Pedido
                  </span>
                  <span className="text-base font-bold text-zinc-900">
                    {formatCentsToBrl(totalCents)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-zinc-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 active:bg-black transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-amber-400" />
                      <span>Enviando para a cozinha...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Pedido para a Cozinha</span>
                      <ArrowRight className="size-4 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            )}
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
