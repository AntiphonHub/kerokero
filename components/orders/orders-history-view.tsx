'use client';

import { useState } from 'react';
import { HistorySummaryCards } from './history-summary-cards';
import { HistoryFilters } from './history-filters';
import { SessionsTable } from './sessions-table';
import { ItemsTable } from './items-table';
import { SessionDetailsDrawer } from './session-details-drawer';
import type { OrdersHistoryData } from '@/lib/appwrite/orders-history';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';

interface OrdersHistoryViewProps {
  initialData: OrdersHistoryData;
}

export function OrdersHistoryView({ initialData }: OrdersHistoryViewProps) {
  const [selectedSession, setSelectedSession] = useState<TableSessionDocument | null>(null);

  const { summary, sessions, items, activeFilters } = initialData;

  const sessionOrders = selectedSession
    ? items.filter((item) => item.sessionId === selectedSession.$id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho da Tela */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Histórico de Pedidos
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Conferência de caixa de comandas finalizadas e conciliação entre PIX e Maquininha.
        </p>
      </div>

      {/* Cards de Resumo Financeiro */}
      <HistorySummaryCards summary={summary} />

      {/* Barra de Filtros e Alternador de Abas */}
      <HistoryFilters
        currentTab={activeFilters.tab}
        currentRange={activeFilters.range}
        currentPayment={activeFilters.paymentMethod}
        currentSearch={activeFilters.search}
      />

      {/* Tabela de Visualização Ativa */}
      {activeFilters.tab === 'sessions' ? (
        <SessionsTable
          sessions={sessions}
          onSelectSession={(session) => setSelectedSession(session)}
        />
      ) : (
        <ItemsTable items={items} />
      )}

      {/* Drawer com Detalhes da Comanda Selecionada */}
      <SessionDetailsDrawer
        session={selectedSession}
        orders={sessionOrders}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
