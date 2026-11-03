'use client';

import React from 'react';
import { TableDocument } from '@/lib/appwrite/tables';
import { TableStatus } from '@/lib/schemas/table';
import { statusConfig } from './table-card';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableListProps {
  tables: TableDocument[];
  onSelectTable: (table: TableDocument) => void;
}

export function TableList({ tables, onSelectTable }: TableListProps) {
  if (tables.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
        <p className="text-sm font-medium text-zinc-500">Nenhuma mesa encontrada com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Mesa</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Chamado Pendente</th>
              <th className="py-3 px-4 text-right">Total da Conta</th>
              <th className="py-3 px-4 text-center">Proteção</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tables.map((table) => {
              const currentStatus = (table.status || 'idle') as TableStatus;
              const config = statusConfig[currentStatus] || statusConfig.idle;

              return (
                <tr
                  key={table.$id}
                  onClick={() => onSelectTable(table)}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-bold text-zinc-900 text-sm">
                    {table.label || `Mesa ${String(table.number).padStart(2, '0')}`}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                        config.textColor,
                        config.borderColor,
                        'bg-white',
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
                      {config.label}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {table.serviceCallReason ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-medium text-xs border border-amber-200">
                        {table.serviceCallReason}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-zinc-900">
                    {formatCurrency(table.currentTotal || 0)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-400 uppercase font-medium"
                      title="Geofencing Indoor Validado"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      Indoor
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTable(table);
                      }}
                      className="h-7 text-xs font-medium text-zinc-600 hover:text-zinc-900 gap-1 rounded-lg cursor-pointer"
                    >
                      Ver Mesa
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
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
