'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CreditCard, MessageSquare, Check, ArrowRight } from 'lucide-react';
import { resolveServiceCallAction } from '@/actions/tables';
import { formatBrasiliaDateTime } from '@/lib/formatters';
import type { ServiceCallDocument } from '@/lib/appwrite/tables';

interface LiveServiceCallsProps {
  initialCalls: ServiceCallDocument[];
}

export function LiveServiceCalls({ initialCalls }: LiveServiceCallsProps) {
  const router = useRouter();
  const [calls, setCalls] = useState<ServiceCallDocument[]>(initialCalls);
  const [loadingCallId, setLoadingCallId] = useState<string | null>(null);

  const handleResolve = async (callId: string, tableId: string) => {
    setLoadingCallId(callId);
    try {
      const res = await resolveServiceCallAction(callId, tableId, 'occupied');
      if (res.success) {
        setCalls((prev) =>
          prev.map((c) => (c.$id === callId ? { ...c, status: 'completed' as const } : c)),
        );
        router.refresh();
      }
    } catch (err) {
      console.error('Erro ao concluir chamado:', err);
    } finally {
      setLoadingCallId(null);
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'waiter':
        return { label: 'Garçom na Mesa', icon: Bell };
      case 'bill_card':
        return { label: 'Maquininha de Cartão', icon: CreditCard };
      default:
        return { label: 'Dúvida / Atendimento', icon: MessageSquare };
    }
  };

  const pendingCount = calls.filter((c) => c.status === 'pending').length;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-zinc-900">
            Chamados de Mesa
          </h2>
          {pendingCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">Em dia</span>
          )}
        </div>

        <Link
          href="/tables"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-amber-600 transition-colors"
        >
          Ver Mapa de Mesas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {calls.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400">
          Nenhum chamado de mesa registrado no momento.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {calls.map((call) => {
            const { label, icon: Icon } = getCallTypeLabel(call.type);
            const isPending = call.status === 'pending';
            const isResolving = loadingCallId === call.$id;

            return (
              <div
                key={call.$id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isPending
                        ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                        : 'bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">
                        Mesa {String(call.tableNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-zinc-400">•</span>
                      <span className="text-xs font-medium text-zinc-700">{label}</span>
                    </div>

                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      Solicitado por {call.requestedBy || 'Cliente'}
                      {call.description ? ` (${call.description})` : ''} às{' '}
                      {formatBrasiliaDateTime(call.$createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {isPending ? (
                    <button
                      type="button"
                      disabled={isResolving}
                      onClick={() => handleResolve(call.$id, call.tableId)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      <Check className="h-3 w-3" />
                      {isResolving ? 'Atendendo...' : 'Concluir'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-medium text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100">
                      Atendido
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
