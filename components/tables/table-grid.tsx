'use client';

import React from 'react';
import { TableDocument } from '@/lib/appwrite/tables';
import { TableCard } from './table-card';

export interface TableGridProps {
  tables: TableDocument[];
  onSelectTable: (table: TableDocument) => void;
}

export function TableGrid({ tables, onSelectTable }: TableGridProps) {
  if (tables.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
        <p className="text-sm font-medium text-zinc-500">Nenhuma mesa encontrada com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {tables.map((table) => (
        <TableCard
          key={table.$id}
          table={table}
          onClick={onSelectTable}
        />
      ))}
    </div>
  );
}
