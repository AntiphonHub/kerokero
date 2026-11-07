'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { OrderDocument, OrderStatus } from '@/lib/appwrite/orders';
import {
  getKitchenOrdersAction,
  updateOrderStatusAction,
  batchUpdateOrdersStatusAction,
} from '@/actions/kds';
import { KdsColumn } from './kds-column';
import { KdsSummaryBar } from './kds-summary-bar';
import { playKitchenChime } from './kds-sound';
import { Client } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';
import {
  CookingPot,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KdsViewProps {
  initialOrders: OrderDocument[];
  establishmentId: string;
}

export function KdsView({ initialOrders, establishmentId }: KdsViewProps) {
  const [orders, setOrders] = useState<OrderDocument[]>(initialOrders);
  const [viewMode, setViewMode] = useState<'items' | 'tables'>('items');
  const [search, setSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set());
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Recupera preferência de áudio salva no cliente
  useEffect(() => {
    const saved = localStorage.getItem('bempedi_kds_sound') ?? localStorage.getItem('kerokero_kds_sound');
    if (saved === 'true') {
      setSoundEnabled(true);
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('bempedi_kds_sound', String(next));
    if (next) {
      playKitchenChime();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sincronização manual
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await getKitchenOrdersAction();
      if (res.success && res.orders) {
        setOrders(res.orders);
        setLastSyncTime(new Date());
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Inscrição em Tempo Real via Appwrite Realtime
  useEffect(() => {
    if (!appwriteConfig.endpoint || !appwriteConfig.projectId) return;

    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    const channel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collections.orders}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as OrderDocument;
      if (!payload || !payload.$id || payload.establishmentId !== establishmentId) return;

      const events = response.events;

      setOrders((prev) => {
        if (events.some((e) => e.endsWith('.create'))) {
          if (payload.status === 'delivered' || payload.status === 'cancelled') {
            return prev;
          }
          if (prev.some((o) => o.$id === payload.$id)) return prev;

          // Dispara alerta sonoro para novos pedidos
          if (soundEnabled && payload.status === 'pending') {
            playKitchenChime();
          }

          return [...prev, payload].sort(
            (a, b) => new Date(a.createdAt || a.$createdAt).getTime() - new Date(b.createdAt || b.$createdAt).getTime()
          );
        }

        if (events.some((e) => e.endsWith('.update'))) {
          // Se o pedido foi entregue ou cancelado, remove da esteira ativa
          if (payload.status === 'delivered' || payload.status === 'cancelled') {
            return prev.filter((o) => o.$id !== payload.$id);
          }

          const exists = prev.some((o) => o.$id === payload.$id);
          if (!exists) {
            return [...prev, payload].sort(
              (a, b) => new Date(a.createdAt || a.$createdAt).getTime() - new Date(b.createdAt || b.$createdAt).getTime()
            );
          }

          return prev.map((o) => (o.$id === payload.$id ? payload : o));
        }

        if (events.some((e) => e.endsWith('.delete'))) {
          return prev.filter((o) => o.$id !== payload.$id);
        }

        return prev;
      });

      setLastSyncTime(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, [establishmentId, soundEnabled]);

  // Atualização de status de um item individual
  const handleUpdateStatus = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderIds((prev) => new Set(prev).add(orderId));

    // Atualização otimista
    setOrders((prev) => {
      if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
        return prev.filter((o) => o.$id !== orderId);
      }
      return prev.map((o) => (o.$id === orderId ? { ...o, status: nextStatus } : o));
    });

    try {
      const res = await updateOrderStatusAction(orderId, nextStatus);
      if (!res.success) {
        // Reverte em caso de falha
        await handleSync();
      }
    } catch {
      await handleSync();
    } finally {
      setUpdatingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, []);

  // Atualização em lote (ex: comanda da mesa toda)
  const handleBatchUpdateStatus = useCallback(async (orderIds: string[], nextStatus: OrderStatus) => {
    setUpdatingOrderIds((prev) => {
      const next = new Set(prev);
      orderIds.forEach((id) => next.add(id));
      return next;
    });

    // Atualização otimista
    setOrders((prev) => {
      if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
        const idSet = new Set(orderIds);
        return prev.filter((o) => !idSet.has(o.$id));
      }
      const idSet = new Set(orderIds);
      return prev.map((o) => (idSet.has(o.$id) ? { ...o, status: nextStatus } : o));
    });

    try {
      const res = await batchUpdateOrdersStatusAction(orderIds, nextStatus);
      if (!res.success) {
        await handleSync();
      }
    } catch {
      await handleSync();
    } finally {
      setUpdatingOrderIds((prev) => {
        const next = new Set(prev);
        orderIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, []);

  // Filtros de busca
  const filteredOrders = useMemo(() => {
    let result = orders;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((o) => {
        const tableStr = `mesa ${o.tableNumber}`.toLowerCase();
        const numStr = String(o.tableNumber);
        const prodStr = o.productName.toLowerCase();
        const clientStr = (o.participantName || '').toLowerCase();
        return (
          tableStr.includes(q) ||
          numStr === q ||
          prodStr.includes(q) ||
          clientStr.includes(q)
        );
      });
    }
    return result;
  }, [orders, search]);

  const pendingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'pending'),
    [filteredOrders]
  );
  const preparingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'preparing'),
    [filteredOrders]
  );
  const readyOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'ready'),
    [filteredOrders]
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Barra de Topo do KDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CookingPot className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Cozinha & KDS
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Fila de produção e pedidos em tempo real • Atualizado às{' '}
            {lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        {/* Controles do KDS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Busca por mesa ou item */}
          <div className="relative min-w-[180px] max-w-[260px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar mesa ou prato..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
            />
          </div>

          {/* Alternância de Modo: Por Itens vs Por Mesas */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setViewMode('items')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'items'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
              title="Visualizar por itens individuais"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Por Itens</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tables')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'tables'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
              title="Visualizar agrupado por mesa"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Por Mesas</span>
            </button>
          </div>

          {/* Toggle de Alerta Sonoro */}
          <button
            type="button"
            onClick={toggleSound}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer',
              soundEnabled
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            )}
            title={soundEnabled ? 'Som ativado (clique para silenciar)' : 'Som desativado (clique para ativar bipes de novos pedidos)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="hidden lg:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          {/* Botão de Tela Cheia */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-medium transition-all cursor-pointer"
            title={isFullscreen ? 'Sair da tela cheia' : 'Entrar em modo tela cheia para cozinha'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline">{isFullscreen ? 'Janela' : 'Tela Cheia'}</span>
          </button>

          {/* Botão de Recarregar */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSync}
            className="flex items-center justify-center p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer disabled:opacity-50"
            title="Atualizar fila de pedidos"
            aria-label="Atualizar"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Barra de Resumo de Produção (Totais a Preparar) */}
      <KdsSummaryBar orders={orders} />

      {/* Quadro Kanban de 3 Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna 1: Recebidos */}
        <KdsColumn
          status="pending"
          title="Recebidos"
          orders={pendingOrders}
          viewMode={viewMode}
          onUpdateStatus={handleUpdateStatus}
          onBatchUpdateStatus={handleBatchUpdateStatus}
          updatingOrderIds={updatingOrderIds}
        />

        {/* Coluna 2: Em Preparo */}
        <KdsColumn
          status="preparing"
          title="Em Preparo"
          orders={preparingOrders}
          viewMode={viewMode}
          onUpdateStatus={handleUpdateStatus}
          onBatchUpdateStatus={handleBatchUpdateStatus}
          updatingOrderIds={updatingOrderIds}
        />

        {/* Coluna 3: Prontos para Servir */}
        <KdsColumn
          status="ready"
          title="Prontos para Servir"
          orders={readyOrders}
          viewMode={viewMode}
          onUpdateStatus={handleUpdateStatus}
          onBatchUpdateStatus={handleBatchUpdateStatus}
          updatingOrderIds={updatingOrderIds}
        />
      </div>
    </div>
  );
}
