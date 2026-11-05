'use client';

import { useMemo } from 'react';
import { OrderDocument, OrderStatus } from '@/lib/appwrite/orders';
import {
  calculateOrderUrgency,
  formatElapsedTime,
  parseSelectedOptions,
  getNextOrderStatus,
  getPreviousOrderStatus,
  TableOrdersGroup,
} from '@/lib/utils/kds';
import { Clock, User, AlertCircle, ArrowRight, Undo2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KdsTableCardProps {
  group: TableOrdersGroup;
  status: OrderStatus;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onBatchUpdateStatus: (orderIds: string[], nextStatus: OrderStatus) => Promise<void>;
  isUpdating?: boolean;
}

export function KdsTableCard({
  group,
  status,
  onUpdateStatus,
  onBatchUpdateStatus,
  isUpdating,
}: KdsTableCardProps) {
  const urgency = useMemo(() => calculateOrderUrgency(group.oldestCreatedAt), [group.oldestCreatedAt]);
  const elapsed = useMemo(() => formatElapsedTime(group.oldestCreatedAt), [group.oldestCreatedAt]);

  const nextStatus = getNextOrderStatus(status);
  const prevStatus = getPreviousOrderStatus(status);

  const orderIds = group.orders.map((o) => o.$id);

  const getNextButtonLabel = (s: OrderStatus): string => {
    switch (s) {
      case 'pending':
        return 'Preparar Mesa';
      case 'preparing':
        return 'Mesa Pronta';
      case 'ready':
        return 'Entregar Mesa';
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
      {/* Topo: Mesa + Tempo decorrido mais antigo */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-tight text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md">
            Mesa {String(group.tableNumber).padStart(2, '0')}
          </span>
          <span className="text-xs font-semibold text-zinc-500">
            {group.orders.length} {group.orders.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        <div
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
            urgency === 'critical'
              ? 'bg-rose-50 text-rose-700'
              : urgency === 'warning'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-zinc-100 text-zinc-600'
          )}
        >
          <Clock className="w-3 h-3" />
          <span>{elapsed}</span>
        </div>
      </div>

      {/* Lista de Itens da Mesa */}
      <div className="flex-1 flex flex-col gap-2.5 divide-y divide-zinc-100">
        {group.orders.map((order) => {
          const options = parseSelectedOptions(order.selectedOptions);
          return (
            <div key={order.$id} className="pt-2 first:pt-0 flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-zinc-900">
                    {order.quantity}x
                  </span>
                  <span className="text-sm font-medium text-zinc-900 leading-tight">
                    {order.productName}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1 shrink-0">
                  <User className="w-3 h-3 text-zinc-400" />
                  <span className="truncate max-w-[80px]">{order.participantName || 'Cliente'}</span>
                </span>
              </div>

              {options.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {options.map((opt, idx) => (
                    <span
                      key={idx}
                      className="inline-block text-[10px] font-medium bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}

              {order.notes && order.notes.trim().length > 0 && (
                <div className="flex items-start gap-1 bg-amber-50/70 border border-amber-200/60 rounded p-1.5 text-[11px] text-amber-900 mt-0.5">
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span className="font-medium break-words leading-tight">{order.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ações da Mesa Inteira */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 mt-1">
        {prevStatus ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onBatchUpdateStatus(orderIds, prevStatus)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Voltar todos os itens da mesa ao status anterior"
            aria-label="Voltar status da mesa"
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
            onClick={() => onBatchUpdateStatus(orderIds, nextStatus)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-60',
              status === 'ready'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-zinc-900 hover:bg-zinc-800'
            )}
          >
            {status === 'ready' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            <span>{getNextButtonLabel(status)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
