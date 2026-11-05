'use client';

import { useMemo } from 'react';
import { OrderDocument, OrderStatus } from '@/lib/appwrite/orders';
import {
  calculateOrderUrgency,
  formatElapsedTime,
  parseSelectedOptions,
  getNextOrderStatus,
  getPreviousOrderStatus,
} from '@/lib/utils/kds';
import { Clock, User, AlertCircle, ArrowRight, Undo2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KdsCardProps {
  order: OrderDocument;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  isUpdating?: boolean;
}

export function KdsCard({ order, onUpdateStatus, isUpdating }: KdsCardProps) {
  const createdAt = order.createdAt || order.$createdAt;
  const urgency = useMemo(() => calculateOrderUrgency(createdAt), [createdAt]);
  const elapsed = useMemo(() => formatElapsedTime(createdAt), [createdAt]);
  const options = useMemo(() => parseSelectedOptions(order.selectedOptions), [order.selectedOptions]);

  const nextStatus = getNextOrderStatus(order.status);
  const prevStatus = getPreviousOrderStatus(order.status);

  const getNextButtonLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'pending':
        return 'Iniciar Preparo';
      case 'preparing':
        return 'Pronto';
      case 'ready':
        return 'Entregar';
      default:
        return 'Avançar';
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-3.5 shadow-2xs transition-all flex flex-col justify-between gap-3',
        urgency === 'critical'
          ? 'border-rose-300 ring-1 ring-rose-200'
          : urgency === 'warning'
          ? 'border-amber-300 ring-1 ring-amber-100'
          : 'border-zinc-200/80 hover:border-zinc-300'
      )}
    >
      {/* Topo do Card: Mesa + Tempo de Espera */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
            Mesa {String(order.tableNumber).padStart(2, '0')}
          </span>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <User className="w-3 h-3 text-zinc-400" />
            <span className="truncate max-w-[100px]">{order.participantName || 'Cliente'}</span>
          </span>
        </div>

        {/* Badge de Tempo */}
        <div
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
            urgency === 'critical'
              ? 'bg-rose-50 text-rose-700'
              : urgency === 'warning'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-zinc-100 text-zinc-600'
          )}
          title={`Pedido realizado em ${new Date(createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        >
          <Clock className="w-3 h-3" />
          <span>{elapsed}</span>
        </div>
      </div>

      {/* Conteúdo Central: Item, Quantidade, Opções e Observações */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-zinc-900">
            {order.quantity}x
          </span>
          <span className="text-sm font-semibold text-zinc-900 leading-snug">
            {order.productName}
          </span>
        </div>

        {/* Adicionais / Opções */}
        {options.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {options.map((opt, idx) => (
              <span
                key={idx}
                className="inline-block text-[11px] font-medium bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded"
              >
                {opt}
              </span>
            ))}
          </div>
        )}

        {/* Observações da Cozinha com Destaque de Atenção */}
        {order.notes && order.notes.trim().length > 0 && (
          <div className="flex items-start gap-1.5 bg-amber-50/70 border border-amber-200/70 rounded-lg p-2 text-xs text-amber-900 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-medium break-words leading-relaxed">{order.notes}</span>
          </div>
        )}
      </div>

      {/* Ações Inferiores: Avançar e Voltar */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 mt-1">
        {prevStatus ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(order.$id, prevStatus)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Voltar ao status anterior"
            aria-label="Voltar status"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-7" />
        )}

        {nextStatus && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(order.$id, nextStatus)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-60',
              order.status === 'ready'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-zinc-900 hover:bg-zinc-800'
            )}
          >
            {order.status === 'ready' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            <span>{getNextButtonLabel(order.status)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
