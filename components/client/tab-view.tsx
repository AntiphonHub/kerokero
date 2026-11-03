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
  Users,
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
  const handlePay = (mode: 'my_items' | 'split' | 'total') => {
    onOpenPayment?.(mode);
    onPayTab?.(mode);
  };

  const knownParticipants: SessionParticipant[] = session
    ? parseSessionParticipants(session.participants)
    : [];

  const myTotalCents = calculateParticipantTotal(orders, currentParticipantId);

  const currentParticipantDoc = knownParticipants.find(
    (p) => p.id === currentParticipantId,
  );
  const myAlreadyPaidCents = currentParticipantDoc?.paidAmount ?? 0;
  const myRemainingCents = Math.max(0, myTotalCents - myAlreadyPaidCents);

  const tableSummary = calculateTableSummary(session, orders);
  const participantGroups = groupOrdersByParticipant(orders, knownParticipants);

  return (
    <div className="flex flex-col flex-1 pb-28">
      {/* Table Header Banner */}
      <div className="p-4 bg-white border-b border-zinc-200/80">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Comanda Digital
            </span>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
              {tableLabel || `Mesa ${tableNumber}`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Atualizar comanda"
                className="size-9 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-4 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`}
                />
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ao Vivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Mesa Completa */}
      <div className="p-4 space-y-4">
        {/* Table Financial Summary Card */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Resumo da Mesa
          </span>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-[10px] text-zinc-500 block">Total Geral</span>
              <span className="text-xs font-bold text-zinc-900 mt-0.5 block truncate">
                {formatCentsToBrl(tableSummary.totalAmount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block">Já Pago</span>
              <span className="text-xs font-bold text-emerald-800 mt-0.5 block truncate">
                {formatCentsToBrl(tableSummary.paidAmount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[10px] text-amber-800 block">Saldo Aberto</span>
              <span className="text-xs font-bold text-amber-900 mt-0.5 block truncate">
                {formatCentsToBrl(tableSummary.remainingBalance)}
              </span>
            </div>
          </div>

          {/* Table Action CTAs */}
          {tableSummary.remainingBalance > 0 ? (
            <div
              className={`grid ${myRemainingCents > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 pt-2 border-t border-zinc-100`}
            >
              {myRemainingCents > 0 && (
                <button
                  type="button"
                  onClick={() => handlePay('my_items')}
                  className="min-h-[44px] px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors flex flex-col items-center justify-center shadow-xs active:scale-[0.98]"
                >
                  <span className="truncate">Meus Itens</span>
                  <span className="text-[10px] font-medium opacity-90 truncate">
                    {formatCentsToBrl(myRemainingCents)}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handlePay('split')}
                className="min-h-[44px] px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 text-xs font-bold transition-colors flex flex-col items-center justify-center active:scale-[0.98]"
              >
                <span className="truncate">Dividir Igual</span>
                <span className="text-[10px] text-zinc-500 font-medium truncate">
                  {knownParticipants.length > 0
                    ? formatCentsToBrl(
                        Math.ceil(
                          tableSummary.remainingBalance / knownParticipants.length,
                        ),
                      )
                    : 'Mesa'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePay('total')}
                className="min-h-[44px] px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex flex-col items-center justify-center shadow-xs active:scale-[0.98]"
              >
                <span className="truncate">Conta Total</span>
                <span className="text-[10px] text-zinc-400 font-medium truncate">
                  {formatCentsToBrl(tableSummary.remainingBalance)}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>Conta da mesa quitada integralmente!</span>
            </div>
          )}
        </div>

        {/* Participants on Table */}
        {knownParticipants.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Pessoas na Mesa ({knownParticipants.length})
            </span>

            <div className="flex flex-wrap gap-1.5">
              {knownParticipants.map((p) => {
                const isMe = p.id === currentParticipantId;
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isMe
                        ? 'bg-zinc-900 text-white'
                        : p.isPaid
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200/60'
                    }`}
                  >
                    {p.name}
                    {isMe && ' (Você)'}
                    {p.isPaid && (
                      <CheckCircle2 className="size-3 text-emerald-600 ml-0.5" />
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders Grouped by Participant */}
        <div className="space-y-3">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block px-1">
            Consumo por Participante
          </span>

          {participantGroups.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-white border border-zinc-200/80 text-zinc-500 text-xs">
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
                                    "{order.notes}"
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
      </div>
    </div>
  );
}
