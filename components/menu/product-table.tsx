'use client';

import React from 'react';
import { ProductDocument } from '@/lib/appwrite/products';
import { formatCentsToBrl } from '@/lib/formatters';
import { Switch } from '@/components/ui/switch';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: ProductDocument[];
  onEdit: (product: ProductDocument) => void;
  onDelete: (product: ProductDocument) => void;
  onToggleStatus: (product: ProductDocument) => void;
  togglingIds?: string[];
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  togglingIds = [],
}: ProductTableProps) {
  return (
    <div className="w-full bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 pl-5 pr-4">Produto</th>
              <th className="py-3.5 px-4">Categoria</th>
              <th className="py-3.5 px-4 text-right">Preço</th>
              <th className="py-3.5 px-4 text-right">Happy Hour</th>
              <th className="py-3.5 px-4 text-center">Estoque</th>
              <th className="py-3.5 px-4 text-center">Disponível</th>
              <th className="py-3.5 pl-4 pr-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800">
            {products.map((product) => {
              const isOutOfStock = product.stockQuantity === 0;
              const isToggling = togglingIds.includes(product.$id);

              return (
                <tr
                  key={product.$id}
                  className={cn(
                    'hover:bg-zinc-50/80 transition-colors',
                    !product.isActive && 'opacity-60 bg-zinc-50/40',
                  )}
                >
                  {/* Produto Thumbnail + Nome */}
                  <td className="py-3 pl-5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-zinc-300" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-900 block max-w-xs truncate">
                          {product.name}
                        </span>
                        {product.upsellMessage ? (
                          <span
                            className="text-[11px] text-amber-800 italic block max-w-xs truncate"
                            title={product.upsellMessage}
                          >
                            Sugestão: &ldquo;{product.upsellMessage}&rdquo;
                          </span>
                        ) : product.description ? (
                          <span className="text-[11px] text-zinc-400 block max-w-xs truncate">
                            {product.description}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700">
                      {product.categoryName}
                    </span>
                  </td>

                  {/* Preço Regular */}
                  <td className="py-3 px-4 text-right font-medium text-zinc-900">
                    {formatCentsToBrl(product.price)}
                  </td>

                  {/* Happy Hour */}
                  <td className="py-3 px-4 text-right font-semibold">
                    {product.happyHourPrice != null ? (
                      <span className="text-amber-600">
                        {formatCentsToBrl(product.happyHourPrice)}
                      </span>
                    ) : (
                      <span className="text-zinc-300 font-normal">—</span>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="py-3 px-4 text-center">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-100 text-red-700">
                        Esgotado
                      </span>
                    ) : product.stockQuantity != null ? (
                      <span className="text-zinc-700 font-medium">
                        {product.stockQuantity} un
                      </span>
                    ) : (
                      <span className="text-zinc-400">Ilimitado</span>
                    )}
                  </td>

                  {/* Switch Ativo */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <Switch
                        disabled={isToggling}
                        checked={product.isActive}
                        onCheckedChange={() => onToggleStatus(product)}
                      />
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="py-3 pl-4 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        title="Editar produto"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        title="Excluir produto"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
