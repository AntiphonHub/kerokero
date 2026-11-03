'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TableDocument } from '@/lib/appwrite/tables';
import { TableStatus } from '@/lib/schemas/table';
import { syncTablesAction } from '@/actions/tables';
import { TableGrid } from './table-grid';
import { TableList } from './table-list';
import { TableDetailsDrawer } from './table-details-drawer';
import { TableCardPrintDialog } from './table-card-print-dialog';
import { Button } from '@/components/ui/button';
import { Client } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';
import {
  Search,
  LayoutGrid,
  List,
  Printer,
  RefreshCw,
  Bell,
  CreditCard,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TablesViewProps {
  initialTables: TableDocument[];
  establishmentName?: string;
  establishmentLogoUrl?: string | null;
  appBaseUrl?: string;
}

type FilterOption = 'all' | TableStatus;

export function TablesView({
  initialTables,
  establishmentName,
  establishmentLogoUrl,
  appBaseUrl,
}: TablesViewProps) {
  const [tables, setTables] = useState<TableDocument[]>(initialTables);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableDocument | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Inscrição em Tempo Real via Appwrite Realtime
  useEffect(() => {
    if (!appwriteConfig.endpoint || !appwriteConfig.projectId) return;

    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    const channel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collections.tables}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as TableDocument;
      if (!payload || !payload.$id) return;

      const events = response.events;

      setTables((prev) => {
        if (events.some((e) => e.endsWith('.create'))) {
          // Se já existir não duplica
          if (prev.some((t) => t.$id === payload.$id)) return prev;
          return [...prev, payload].sort((a, b) => a.number - b.number);
        }

        if (events.some((e) => e.endsWith('.update'))) {
          return prev.map((t) => (t.$id === payload.$id ? payload : t));
        }

        if (events.some((e) => e.endsWith('.delete'))) {
          return prev.filter((t) => t.$id !== payload.$id);
        }

        return prev;
      });

      // Atualiza também se for a mesa aberta no drawer
      setSelectedTable((current) => {
        if (current && current.$id === payload.$id) {
          return payload;
        }
        return current;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sincronização manual sob demanda
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncTablesAction();
      if (res.success && res.tables) {
        setTables(res.tables);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTableUpdated = (updated: TableDocument) => {
    setTables((prev) => prev.map((t) => (t.$id === updated.$id ? updated : t)));
    setSelectedTable(updated);
  };

  // Contadores para as pílulas de filtro
  const counts = useMemo(() => {
    return {
      all: tables.length,
      idle: tables.filter((t) => t.status === 'idle').length,
      occupied: tables.filter((t) => t.status === 'occupied').length,
      waiter_called: tables.filter((t) => t.status === 'waiter_called').length,
      bill_requested: tables.filter((t) => t.status === 'bill_requested').length,
      order_placed: tables.filter((t) => t.status === 'order_placed').length,
      paid_pix: tables.filter((t) => t.status === 'paid_pix').length,
    };
  }, [tables]);

  // Filtragem e busca
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchesFilter = filter === 'all' || t.status === filter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        String(t.number).includes(query) ||
        (t.label && t.label.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [tables, filter, search]);

  const filterTabs: Array<{ id: FilterOption; label: string; count: number; icon?: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', label: 'Todas', count: counts.all },
    { id: 'idle', label: 'Livres', count: counts.idle, icon: CheckCircle2 },
    { id: 'occupied', label: 'Ocupadas', count: counts.occupied, icon: Utensils },
    { id: 'waiter_called', label: 'Garçom', count: counts.waiter_called, icon: Bell },
    { id: 'bill_requested', label: 'Maquininha', count: counts.bill_requested, icon: CreditCard },
    { id: 'paid_pix', label: 'Pago no PIX', count: counts.paid_pix },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Topo: Título da Página & Botões de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Mesas & Comandas
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Monitor em tempo real de comandas, pedidos e chamados no salão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-9 text-xs font-medium border-zinc-200 text-zinc-700 hover:text-zinc-900 gap-1.5 rounded-xl cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            Sincronizar
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPrintDialogOpen(true)}
            className="h-9 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white gap-1.5 rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Cartões QR
          </Button>
        </div>
      </div>

      {/* 2. Barra de Ferramentas: Busca, Filtros e Alternador Grade/Tabela */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        {/* Pílulas de Filtro por Status */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
                  isActive
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca e Alternador de Visão */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar mesa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-200 pl-8 pr-3 py-1.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900"
            />
          </div>

          <div className="flex items-center border border-zinc-200 rounded-xl p-0.5 bg-zinc-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Visualização em Grade"
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-700',
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Visualização em Tabela"
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-700',
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Área Principal: Grade ou Tabela */}
      {viewMode === 'grid' ? (
        <TableGrid
          tables={filteredTables}
          onSelectTable={(table) => setSelectedTable(table)}
        />
      ) : (
        <TableList
          tables={filteredTables}
          onSelectTable={(table) => setSelectedTable(table)}
        />
      )}

      {/* 4. Drawer de Detalhes da Mesa */}
      <TableDetailsDrawer
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
        onTableUpdated={handleTableUpdated}
        appBaseUrl={appBaseUrl}
      />

      {/* 5. Diálogo de Impressão de Cartões de Mesa */}
      <TableCardPrintDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        tables={tables}
        establishmentName={establishmentName}
        establishmentLogoUrl={establishmentLogoUrl}
        appBaseUrl={appBaseUrl}
      />
    </div>
  );
}
