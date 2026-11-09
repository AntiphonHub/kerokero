'use client';

import React from 'react';
import type { OrderDocument } from '@/lib/appwrite/orders';
import type {
  TableSessionDocument,
  SessionParticipant,
} from '@/lib/appwrite/client-sessions';
import {
  parseSessionParticipants,
  calculateParticipantTotal,
  groupOrdersByParticipant,
  calculateTableSummary,
  getOrderStatusInfo,
  formatSelectedOptionsSummary,
} from '@/lib/utils/tab';
import { formatCentsToBrl } from '@/lib/formatters';
import {
  CheckCircle2,
  RefreshCw,
  CreditCard,
} from 'lucide-react';

export interface TabViewProps {
  orders: OrderDocument[];
  session: TableSessionDocument | null;
  currentParticipantId: string;
  currentParticipantName: string;
  tableNumber: number;
  tableLabel?: string;
  onPayTab?: (mode: 'my_items' | 'split' | 'total') => void;
  onOpenPayment?: (mode: 'my_items' | 'split' | 'total') => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TabView({
  orders,
  session,
  currentParticipantId,
  tableNumber,
  tableLabel,
  onPayTab,
  onOpenPayment,
  onRefresh,
  isRefreshing = false,
}: TabViewProps) {
  const handlePay = (mode: 'my_items' | 'split' | 'total' = 'total') => {
    onOpenPayment?.(mode);
    onPayTab?.(mode);
  };

  const knownParticipants: SessionParticipant[] = session
    ? parseSessionParticipants(session.participants)
    : [];

  const tableSummary = calculateTableSummary(session, orders);
  const participantGroups = groupOrdersByParticipant(orders, knownParticipants);

  return (
    <div className="flex flex-col flex-1 pb-36">
      {/* Top Bar: Title & Refresh */}
      <div className="px-4 py-3 bg-white border-b border-zinc-200/80 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-900 tracking-tight uppercase">
          Consumo da Mesa
        </span>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar comanda"
            className="size-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Main Content: Orders Grouped by Participant */}
      <div className="p-4 space-y-3">
        {participantGroups.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-white border border-zinc-200/80 text-zinc-500 text-xs">
            Nenhum pedido registrado nesta mesa ainda.
          </div>
        ) : (
          participantGroups.map((group) => {
            const isMe = group.participantId === currentParticipantId;

            return (
              <div
                key={group.participantId}
                className="rounded-2xl bg-white border border-zinc-200/80 shadow-2xs overflow-hidden"
              >
                {/* Participant Header */}
                <div className="p-3 bg-zinc-50/80 border-b border-zinc-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[11px] font-bold">
                      {group.participantName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {group.participantName} {isMe && '(Você)'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-zinc-900">
                    {formatCentsToBrl(group.totalCents)}
                  </span>
                </div>

                {/* Participant Items */}
                <div className="p-3 space-y-2">
                  {group.orders.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">
                      Nenhum item pedido até o momento.
                    </p>
                  ) : (
                    group.orders.map((order) => {
                      const statusInfo = getOrderStatusInfo(order.status);
                      const optionsText = formatSelectedOptionsSummary(
                        order.selectedOptions,
                      );

                      return (
                        <div
                          key={order.$id}
                          className="text-xs py-1.5 border-b border-zinc-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="font-medium text-zinc-900 block truncate">
                                {order.quantity}x {order.productName}
                              </span>
                              <span
                                className={`inline-block mt-0.5 px-1.5 py-0.2 rounded-sm text-[9px] font-medium border ${statusInfo.bgClass} ${statusInfo.colorClass} ${statusInfo.borderClass}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                            <span className="font-semibold text-zinc-900 shrink-0">
                              {formatCentsToBrl(
                                order.totalPrice ?? order.unitPrice * order.quantity,
                              )}
                            </span>
                          </div>
                          {(optionsText || order.notes) && (
                            <div className="mt-1 text-[11px] text-zinc-500 pl-0.5 space-y-0.5">
                              {optionsText && (
                                <p className="truncate">
                                  <span className="font-medium text-zinc-600">Opções:</span>{' '}
                                  {optionsText}
                                </p>
                              )}
                              {order.notes && (
                                <p className="italic text-zinc-400 truncate">
                                  &quot;{order.notes}&quot;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Payment Bar (Above Bottom Nav) */}
      {tableSummary.remainingBalance > 0 ? (
        <div className="fixed bottom-20 inset-x-4 z-20 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => handlePay('total')}
            className="w-full min-h-[52px] bg-zinc-900 text-white rounded-2xl px-4 py-3 shadow-xl border border-zinc-800 flex items-center justify-between hover:bg-zinc-800 active:scale-[0.99] transition-all"
          >
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Saldo em Aberto
              </span>
              <span className="text-base font-bold text-white tracking-tight">
                {formatCentsToBrl(tableSummary.remainingBalance)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-xl px-4 py-2.5 transition-colors shadow-2xs">
              <CreditCard className="size-4" />
              <span>Pagar Conta</span>
            </div>
          </button>
        </div>
      ) : orders.length > 0 ? (
        <div className="fixed bottom-20 inset-x-4 z-20 max-w-lg mx-auto">
          <div className="w-full p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center text-xs font-semibold text-emerald-800 shadow-lg flex items-center justify-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Conta da mesa quitada integralmente!</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
