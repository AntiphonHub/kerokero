'use client';

import { ChevronRight, QrCode, CreditCard, Banknote, Split } from 'lucide-react';
import { formatCentsToBrl, formatBrasiliaDateTime } from '@/lib/formatters';
import { parseSessionParticipants } from '@/lib/utils/tab';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';

interface SessionsTableProps {
  sessions: TableSessionDocument[];
  onSelectSession: (session: TableSessionDocument) => void;
}

export function SessionsTable({ sessions, onSelectSession }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-zinc-900">Nenhuma comanda encontrada</p>
        <p className="text-xs text-zinc-500 mt-1">
          Não há comandas finalizadas para os filtros selecionados no período.
        </p>
      </div>
    );
  }

  const getMethodBadge = (session: TableSessionDocument) => {
    switch (session.paymentMethod) {
      case 'pix_asaas':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
            <QrCode className="h-3 w-3" />
            PIX
          </span>
        );
      case 'pos_card':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 border border-zinc-200/80">
            <CreditCard className="h-3 w-3" />
            Maquininha
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 border border-zinc-200/80">
            <Banknote className="h-3 w-3" />
            Dinheiro
          </span>
        );
      case 'mixed':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
            <Split className="h-3 w-3" />
            Misto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
            <CreditCard className="h-3 w-3" />
            Maquininha
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-5 py-3">Mesa</th>
              <th className="px-5 py-3">Fechamento</th>
              <th className="px-5 py-3">Clientes</th>
              <th className="px-5 py-3">Meio de Pagamento</th>
              <th className="px-5 py-3 text-right">Valor Total</th>
              <th className="px-5 py-3 text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sessions.map((session) => {
              const participants = parseSessionParticipants(session.participants);

              return (
                <tr
                  key={session.$id}
                  onClick={() => onSelectSession(session)}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-bold text-zinc-900">
                    Mesa {String(session.tableNumber || '').padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap">
                    {formatBrasiliaDateTime(session.closedAt)}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {participants.length} {participants.length === 1 ? 'cliente' : 'clientes'}
                  </td>
                  <td className="px-5 py-3.5">{getMethodBadge(session)}</td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-zinc-900 whitespace-nowrap">
                    {formatCentsToBrl(session.totalAmount || session.paidAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </span>
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
