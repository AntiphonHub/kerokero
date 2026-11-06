'use client';

import { QrCode, CreditCard, Banknote, Split } from 'lucide-react';
import { formatCentsToBrl, formatBrasiliaDateTime } from '@/lib/formatters';
import type { HistoryItem } from '@/lib/appwrite/orders-history';

interface ItemsTableProps {
  items: HistoryItem[];
}

export function ItemsTable({ items }: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-zinc-900">Nenhum item encontrado</p>
        <p className="text-xs text-zinc-500 mt-1">
          Não há itens produzidos correspondentes aos filtros selecionados.
        </p>
      </div>
    );
  }

  const getMethodBadge = (method?: string) => {
    switch (method) {
      case 'pix_asaas':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
            <QrCode className="h-3 w-3" />
            PIX Asaas
          </span>
        );
      case 'pos_card':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            <CreditCard className="h-3 w-3" />
            Maquininha
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            <Banknote className="h-3 w-3" />
            Dinheiro
          </span>
        );
      case 'mixed':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <Split className="h-3 w-3" />
            Misto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
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
              <th className="px-5 py-3">Horário</th>
              <th className="px-5 py-3">Mesa</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Produto & Observação</th>
              <th className="px-5 py-3 text-center">Qtd</th>
              <th className="px-5 py-3 text-right">Valor Unitário</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">Meio de Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item) => {
              const totalPrice = item.totalPrice ?? (item.unitPrice || 0) * (item.quantity || 1);

              return (
                <tr key={item.$id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                    {formatBrasiliaDateTime(item.createdAt || item.$createdAt)}
                  </td>
                  <td className="px-5 py-3 font-bold text-zinc-900 whitespace-nowrap">
                    Mesa {String(item.tableNumber).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3 font-medium text-zinc-700 whitespace-nowrap">
                    {item.participantName || 'Cliente'}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-zinc-900">{item.productName}</p>
                    {item.notes && (
                      <p className="text-[11px] text-zinc-500 italic mt-0.5">
                        Obs: {item.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center font-mono font-bold text-zinc-800">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-600 whitespace-nowrap">
                    {formatCentsToBrl(item.unitPrice)}
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold text-zinc-900 whitespace-nowrap">
                    {formatCentsToBrl(totalPrice)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {getMethodBadge(item.paymentMethod)}
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
