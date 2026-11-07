'use client';

import { X, QrCode, CreditCard, Banknote, Split, Clock, Users, Receipt } from 'lucide-react';
import { formatCentsToBrl, formatBrasiliaDateTime } from '@/lib/formatters';
import { parseSessionParticipants } from '@/lib/utils/tab';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';
import type { OrderDocument } from '@/lib/appwrite/orders';

interface SessionDetailsDrawerProps {
  session: TableSessionDocument | null;
  orders: OrderDocument[];
  onClose: () => void;
}

export function SessionDetailsDrawer({ session, orders, onClose }: SessionDetailsDrawerProps) {
  if (!session) return null;

  const participants = parseSessionParticipants(session.participants);

  const getPaymentDetails = () => {
    switch (session.paymentMethod) {
      case 'pix_asaas':
        return {
          label: 'PIX (Digital)',
          icon: QrCode,
          description: 'Liquidado diretamente via PIX instantâneo.',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'pos_card':
        return {
          label: 'Maquininha (Cartão)',
          icon: CreditCard,
          description: 'Pago fisicamente em maquininha de cartão no salão.',
          badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
        };
      case 'cash':
        return {
          label: 'Dinheiro',
          icon: Banknote,
          description: 'Pago em espécie diretamente no caixa/garçom.',
          badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
        };
      case 'mixed':
        return {
          label: 'Pagamento Misto',
          icon: Split,
          description: `${formatCentsToBrl(session.pixPaidAmount || 0)} no PIX + ${formatCentsToBrl(
            session.posPaidAmount || 0,
          )} na Maquininha`,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      default:
        return {
          label: 'Maquininha / Loja',
          icon: CreditCard,
          description: 'Encerrado e recebido presencialmente.',
          badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
        };
    }
  };

  const payment = getPaymentDetails();
  const PaymentIcon = payment.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Comanda Finalizada
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 mt-0.5">
                  Mesa {String(session.tableNumber || '').padStart(2, '0')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metadados: Horários e Participantes */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>Fechada em {formatBrasiliaDateTime(session.closedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span>{participants.length} {participants.length === 1 ? 'cliente' : 'clientes'}</span>
              </div>
            </div>

            {/* Badge de Meio de Pagamento */}
            <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${payment.badgeClass}`}>
              <PaymentIcon className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">{payment.label}</p>
                <p className="opacity-80 mt-0.5">{payment.description}</p>
              </div>
            </div>
          </div>

          {/* Conteúdo: Itens por Participante */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Consumo da Mesa
            </h3>

            {participants.length === 0 && orders.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                Nenhum detalhe de item registrado nesta comanda.
              </p>
            ) : (
              participants.map((participant) => {
                const participantOrders = orders.filter((o) => o.participantId === participant.id);
                const participantTotal = participantOrders.reduce(
                  (sum, o) => sum + (o.totalPrice || o.unitPrice * o.quantity),
                  0,
                );

                return (
                  <div key={participant.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 text-xs">
                      <span className="font-bold text-zinc-900">{participant.name}</span>
                      <span className="font-extrabold text-zinc-900">
                        {formatCentsToBrl(participantTotal)}
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-100 mt-2">
                      {participantOrders.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 py-1">Nenhum item lançado</p>
                      ) : (
                        participantOrders.map((item) => (
                          <div key={item.$id} className="py-2 flex items-start justify-between gap-2 text-xs">
                            <div>
                              <p className="font-medium text-zinc-800">
                                {item.quantity}x {item.productName}
                              </p>
                              {item.notes && (
                                <p className="text-[11px] text-zinc-500 italic mt-0.5">
                                  Obs: {item.notes}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold text-zinc-900 shrink-0">
                              {formatCentsToBrl(item.totalPrice || item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé Fixo com Total */}
          <div className="p-5 border-t border-zinc-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-400">Total Liquidado</span>
                <p className="text-2xl font-black text-zinc-900">
                  {formatCentsToBrl(session.totalAmount || session.paidAmount)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-lg font-mono">
                <Receipt className="h-3.5 w-3.5" />
                <span>Conta Quitada</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
