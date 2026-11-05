'use client';

import { useMemo } from 'react';
import { OrderDocument, OrderStatus } from '@/lib/appwrite/orders';
import { groupOrdersByTable } from '@/lib/utils/kds';
import { KdsCard } from './kds-card';
import { KdsTableCard } from './kds-table-card';
import { Inbox, Flame, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KdsColumnProps {
  status: 'pending' | 'preparing' | 'ready';
  title: string;
  orders: OrderDocument[];
  viewMode: 'items' | 'tables';
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onBatchUpdateStatus: (orderIds: string[], nextStatus: OrderStatus) => Promise<void>;
  updatingOrderIds: Set<string>;
}

export function KdsColumn({
  status,
  title,
  orders,
  viewMode,
  onUpdateStatus,
  onBatchUpdateStatus,
  updatingOrderIds,
}: KdsColumnProps) {
  const tableGroups = useMemo(() => {
    if (viewMode === 'tables') {
      return groupOrdersByTable(orders);
    }
    return [];
  }, [orders, viewMode]);

  const getStatusIcon = (s: typeof status) => {
    switch (s) {
      case 'pending':
        return <Inbox className="w-4 h-4 text-amber-600" />;
      case 'preparing':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getHeaderAccent = (s: typeof status) => {
    switch (s) {
      case 'pending':
        return 'border-t-2 border-t-amber-500';
      case 'preparing':
        return 'border-t-2 border-t-orange-500';
      case 'ready':
        return 'border-t-2 border-t-emerald-500';
    }
  };

  const count = viewMode === 'tables' ? tableGroups.length : orders.length;

  return (
    <div
      className={cn(
        'flex flex-col bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-3 min-h-[500px]',
        getHeaderAccent(status)
      )}
    >
      {/* Cabeçalho da Coluna */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-zinc-200/60">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h2 className="font-bold text-sm text-zinc-900 tracking-tight">{title}</h2>
        </div>

        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold',
            count > 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'
          )}
        >
          {count}
        </span>
      </div>

      {/* Conteúdo: Lista de Cards */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-0.5">
        {count === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            <span className="text-xs font-medium">Nenhum pedido nesta etapa</span>
          </div>
        ) : viewMode === 'tables' ? (
          tableGroups.map((group) => {
            const isGroupUpdating = group.orders.some((o) => updatingOrderIds.has(o.$id));
            return (
              <KdsTableCard
                key={group.tableId}
                group={group}
                status={status}
                onUpdateStatus={onUpdateStatus}
                onBatchUpdateStatus={onBatchUpdateStatus}
                isUpdating={isGroupUpdating}
              />
            );
          })
        ) : (
          orders.map((order) => (
            <KdsCard
              key={order.$id}
              order={order}
              onUpdateStatus={onUpdateStatus}
              isUpdating={updatingOrderIds.has(order.$id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
