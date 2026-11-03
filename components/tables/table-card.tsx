'use client';

import React from 'react';
import { TableDocument } from '@/lib/appwrite/tables';
import { TableStatus } from '@/lib/schemas/table';
import { formatCurrency } from '@/lib/formatters';
import { Bell, CreditCard, Utensils, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableCardProps {
  table: TableDocument;
  onClick: (table: TableDocument) => void;
  className?: string;
}

export const statusConfig: Record<
  TableStatus,
  {
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    dotColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  idle: {
    label: 'Livre',
    bgColor: 'bg-zinc-50/70',
    borderColor: 'border-zinc-200/80',
    textColor: 'text-zinc-500',
    dotColor: 'bg-zinc-300',
    icon: CheckCircle2,
  },
  occupied: {
    label: 'Ocupada',
    bgColor: 'bg-white',
    borderColor: 'border-zinc-300',
    textColor: 'text-zinc-900',
    dotColor: 'bg-zinc-900',
    icon: Utensils,
  },
  order_placed: {
    label: 'Pedido Realizado',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
    dotColor: 'bg-amber-500',
    icon: Utensils,
  },
  waiter_called: {
    label: 'Chamou Garçom',
    bgColor: 'bg-amber-100/60',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-950',
    dotColor: 'bg-amber-600',
    icon: Bell,
  },
  bill_requested: {
    label: 'Solicitou Maquininha',
    bgColor: 'bg-amber-50/80',
    borderColor: 'border-amber-300',
    textColor: 'text-zinc-900',
    dotColor: 'bg-amber-600',
    icon: CreditCard,
  },
  paid_pix: {
    label: 'Pago no PIX',
    bgColor: 'bg-emerald-50/60',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900',
    dotColor: 'bg-emerald-600',
    icon: CheckCircle2,
  },
};

export function TableCard({ table, onClick, className }: TableCardProps) {
  const currentStatus = (table.status || 'idle') as TableStatus;
  const config = statusConfig[currentStatus] || statusConfig.idle;
  const StatusIcon = config.icon;

  const isAlert = currentStatus === 'waiter_called' || currentStatus === 'bill_requested';

  return (
    <div
      onClick={() => onClick(table)}
      className={cn(
        'group relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left',
        'hover:shadow-md hover:-translate-y-0.5',
        config.bgColor,
        config.borderColor,
        isAlert && 'ring-2 ring-amber-400/40',
        className,
      )}
    >
      {/* Topo do Card: Identificação da Mesa + Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Mesa
          </span>
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">
            {table.label || `Mesa ${String(table.number).padStart(2, '0')}`}
          </h3>
        </div>

        {/* Badge Discreta de Status */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
            config.textColor,
            config.borderColor,
            'bg-white/80',
          )}
        >
          <span className={cn('w-2 h-2 rounded-full shrink-0', config.dotColor)} />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Meio: Alerta Específico se Houver Chamado Ativo */}
      {table.serviceCallReason && (
        <div className="my-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-900 flex items-center gap-2">
          <StatusIcon className="w-3.5 h-3.5 shrink-0 text-amber-700" />
          <span className="truncate">{table.serviceCallReason}</span>
        </div>
      )}

      {/* Rodapé: Total da Comanda + Validação Indoor */}
      <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-500">
        <div>
          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Conta</span>
          <span className="font-bold text-zinc-900 text-sm">
            {formatCurrency(table.currentTotal || 0)}
          </span>
        </div>

        {/* Indicador de Segurança Indoor Estrita */}
        <div
          className="flex items-center gap-1 text-[11px] text-zinc-400"
          title="Sessão Indoor 100% Protegida por Geofencing"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium text-[10px] uppercase tracking-wide">Indoor</span>
        </div>
      </div>
    </div>
  );
}
