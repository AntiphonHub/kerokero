'use client';

import React from 'react';
import { ProductDocument } from '@/lib/appwrite/products';
import { formatCentsToBrl } from '@/lib/formatters';
import { Switch } from '@/components/ui/switch';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: ProductDocument;
  onEdit: (product: ProductDocument) => void;
  onDelete: (product: ProductDocument) => void;
  onToggleStatus: (product: ProductDocument) => void;
  isToggling?: boolean;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggling = false,
}: ProductCardProps) {
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs transition-all duration-200 hover:border-zinc-300 hover:shadow-sm',
        !product.isActive && 'opacity-70 bg-zinc-50/60',
      )}
    >
      <div>
        {/* Banner de Imagem */}
        <div className="relative w-full aspect-[16/10] rounded-xl bg-zinc-100 border border-zinc-100 overflow-hidden mb-3.5 flex items-center justify-center">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-zinc-300" />
          )}

          {/* Badge de Esgotado ou Status */}
          {isOutOfStock ? (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-100/95 text-red-700 border border-red-200 shadow-xs">
              Esgotado
            </span>
          ) : (
            product.stockQuantity != null && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/95 text-zinc-700 border border-zinc-200/80 shadow-xs backdrop-blur-xs">
                {product.stockQuantity} un
              </span>
            )
          )}

          {/* Categoria */}
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-900/80 text-white backdrop-blur-xs">
            {product.categoryName}
          </span>
        </div>

        {/* Informações Textuais */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-zinc-900 line-clamp-1" title={product.name}>
            {product.name}
          </h3>
          <p className="text-xs text-zinc-500 line-clamp-2 min-h-[32px] leading-relaxed">
            {product.description || 'Sem descrição cadastrada.'}
          </p>
        </div>

        {/* Tags de Adicionais e Upsell */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {product.addons && product.addons.length > 0 && (
            <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 rounded px-1.5 py-0.5">
              +{product.addons.length} adicionais
            </span>
          )}
          {product.upsellProductIds && product.upsellProductIds.length > 0 && (
            <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
              {product.upsellProductIds.length} sugestões
            </span>
          )}
        </div>

        {/* Frase de Upsell customizada */}
        {product.upsellMessage && (
          <p className="text-[11px] text-amber-800 italic line-clamp-1 mt-2 bg-amber-50/70 px-2 py-1 rounded-lg border border-amber-200/50">
            &ldquo;{product.upsellMessage}&rdquo;
          </p>
        )}
      </div>

      {/* Rodapé com Preço e Ações */}
      <div className="pt-3.5 mt-3.5 border-t border-zinc-100 flex items-center justify-between">
        <div>
          {product.happyHourPrice != null ? (
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400 line-through">
                {formatCentsToBrl(product.price)}
              </span>
              <span className="text-sm font-bold text-amber-600">
                {formatCentsToBrl(product.happyHourPrice)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-zinc-900">
              {formatCentsToBrl(product.price)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle de Ativo */}
          <div className="flex items-center gap-1.5">
            <Switch
              disabled={isToggling}
              checked={product.isActive}
              onCheckedChange={() => onToggleStatus(product)}
            />
          </div>

          {/* Botões de Ação */}
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
      </div>
    </div>
  );
}
