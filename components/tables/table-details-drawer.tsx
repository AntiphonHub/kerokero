'use client';

import React, { useState, useEffect } from 'react';
import { TableDocument, ServiceCallDocument } from '@/lib/appwrite/tables';
import { TableStatus } from '@/lib/schemas/table';
import { statusConfig } from './table-card';
import { formatCurrency } from '@/lib/formatters';
import {
  getTableDetailsAction,
  resolveServiceCallAction,
  resetTableAction,
  settleAndCloseTableAction,
} from '@/actions/tables';
import { Button } from '@/components/ui/button';
import {
  X,
  Bell,
  Check,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableDetailsDrawerProps {
  table: TableDocument | null;
  onClose: () => void;
  onTableUpdated: (table: TableDocument) => void;
  appBaseUrl?: string;
}

export function TableDetailsDrawer({
  table,
  onClose,
  onTableUpdated,
  appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: TableDetailsDrawerProps) {
  const [serviceCalls, setServiceCalls] = useState<ServiceCallDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!table) return;

    let isMounted = true;
    setIsLoading(true);

    getTableDetailsAction(table.$id)
      .then((res) => {
        if (isMounted && res.success) {
          setServiceCalls(res.serviceCalls || []);
          if (res.table) {
            onTableUpdated(res.table);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [table?.$id]);

  if (!table) return null;

  const currentStatus = (table.status || 'idle') as TableStatus;
  const config = statusConfig[currentStatus] || statusConfig.idle;

  const handleResolveCall = async (callId: string) => {
    setIsProcessing(true);
    try {
      const res = await resolveServiceCallAction(callId, table.$id, 'occupied');
      if (res.success) {
        setServiceCalls((prev) => prev.filter((c) => c.$id !== callId));
        onTableUpdated({
          ...table,
          serviceCallReason: null,
          status: 'occupied',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetTable = async () => {
    if (!confirm(`Deseja realmente liberar a ${table.label}? A conta e o status voltarão para Livre.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await resetTableAction(table.$id);
      if (res.success && res.data) {
        onTableUpdated(res.data);
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSettleTable = async () => {
    if (
      !confirm(
        `Confirmar recebimento na maquininha e encerrar a comanda da ${table.label}? Todos os clientes da mesa terão a conta quitada e a sessão encerrada.`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await settleAndCloseTableAction(table.$id);
      if (res.success && res.data) {
        onTableUpdated(res.data.table);
        setServiceCalls([]);
        onClose();
      } else {
        alert(res.message || 'Erro ao quitar comanda da mesa.');
      }
    } catch {
      alert('Erro de conexão ao encerrar a mesa.');
    } finally {
      setIsProcessing(false);
    }
  };

  const tableUrl = `${appBaseUrl}/m/${table.token}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <aside className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Detalhes da Mesa
              </span>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                {table.label || `Mesa ${String(table.number).padStart(2, '0')}`}
              </h2>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                config.textColor,
                config.borderColor,
                'bg-white',
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
              {config.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Resumo Financeiro da Mesa */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
            <div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide block">
                Total Acumulado na Comanda
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 tracking-tight">
                  {formatCurrency(table.currentTotal || 0)}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  Sessão 100% Indoor
                </span>
              </div>
            </div>

            {currentStatus !== 'idle' && (
              <Button
                type="button"
                disabled={isProcessing}
                onClick={handleSettleTable}
                className="w-full h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marcar como Pago & Fechar Comanda</span>
              </Button>
            )}
          </div>

          {/* Chamados Pendentes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Chamados Ativos</span>
              {serviceCalls.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  {serviceCalls.length}
                </span>
              )}
            </h3>

            {isLoading ? (
              <p className="text-xs text-zinc-400 py-3">Carregando chamados...</p>
            ) : serviceCalls.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 text-center">
                <p className="text-xs text-zinc-400 font-medium">Nenhum chamado de garçom ou maquininha pendente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {serviceCalls.map((call) => (
                  <div
                    key={call.$id}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Bell className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-950">
                          {call.type === 'bill_card'
                            ? 'Solicitou Maquininha na Mesa'
                            : call.description || 'Chamou o Garçom'}
                        </p>
                        <span className="text-[10px] text-amber-800">
                          Cliente: {call.requestedBy}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {call.type === 'bill_card' && (
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={handleSettleTable}
                          className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 gap-1 cursor-pointer shrink-0 shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Marcar Pago
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolveCall(call.$id)}
                        className={cn(
                          "h-8 text-xs font-semibold rounded-lg px-2.5 gap-1 cursor-pointer shrink-0 shadow-2xs transition-colors",
                          call.type === 'bill_card'
                            ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Atender
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link e Token do QR Code */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 bg-white">
            <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 mb-1.5">
              <QrCode className="w-3.5 h-3.5 text-zinc-500" />
              Token Criptográfico do QR Code
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              O link desta mesa é assinado e intransferível. Clientes fora do estabelecimento são barrados pelo geofencing indoor.
            </p>
            <div className="mt-2.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200 font-mono text-[10px] text-zinc-600 truncate select-all">
              {tableUrl}
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="p-5 border-t border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
          <Button
            variant="outline"
            onClick={handleResetTable}
            disabled={isProcessing || currentStatus === 'idle'}
            className="flex-1 h-10 text-xs font-medium text-zinc-700 hover:text-zinc-900 border-zinc-200 gap-1.5 rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Liberar Mesa
          </Button>

          <Button
            onClick={onClose}
            className="flex-1 h-10 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
          >
            Fechar
          </Button>
        </div>
      </aside>
    </div>
  );
}
