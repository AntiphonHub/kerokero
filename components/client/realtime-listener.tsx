'use client';

import { useEffect, useRef } from 'react';
import { Client } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';

export interface RealtimeListenerProps {
  sessionId?: string;
  tableId?: string;
  onOrderUpdate?: () => void;
  onSessionUpdate?: () => void;
  onUpdate?: () => void;
  pollIntervalMs?: number; // padrão 8000ms para sync de fundo
}

export function RealtimeListener({
  sessionId,
  tableId,
  onOrderUpdate,
  onSessionUpdate,
  onUpdate,
  pollIntervalMs = 8000,
}: RealtimeListenerProps) {
  const onOrderUpdateRef = useRef(onOrderUpdate);
  const onSessionUpdateRef = useRef(onSessionUpdate);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
    onSessionUpdateRef.current = onSessionUpdate;
    onUpdateRef.current = onUpdate;
  }, [onOrderUpdate, onSessionUpdate, onUpdate]);

  // 1. Appwrite Realtime WebSocket subscription
  useEffect(() => {
    if (!appwriteConfig.endpoint || !appwriteConfig.projectId) {
      return;
    }

    let client: Client;
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeSessions: (() => void) | null = null;

    try {
      client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId);

      // Inscrição em pedidos
      const ordersChannel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collections.orders}.documents`;
      unsubscribeOrders = client.subscribe(ordersChannel, (response) => {
        const payload = response.payload as Record<string, unknown> | undefined;
        if (!payload) return;

        // Se sessionId for conhecido, filtra apenas eventos desta sessão
        if (sessionId && payload.sessionId && payload.sessionId !== sessionId) {
          return;
        }

        onOrderUpdateRef.current?.();
        onUpdateRef.current?.();
      });

      // Inscrição em sessões da comanda
      const sessionsChannel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collections.tableSessions}.documents`;
      unsubscribeSessions = client.subscribe(sessionsChannel, (response) => {
        const payload = response.payload as Record<string, unknown> | undefined;
        if (!payload) return;

        if (sessionId && payload.$id && payload.$id !== sessionId) {
          return;
        }

        onSessionUpdateRef.current?.();
        onUpdateRef.current?.();
      });
    } catch (err) {
      console.warn('[RealtimeListener] Falha ao iniciar WebSocket Appwrite:', err);
    }

    return () => {
      if (unsubscribeOrders) {
        try {
          unsubscribeOrders();
        } catch {}
      }
      if (unsubscribeSessions) {
        try {
          unsubscribeSessions();
        } catch {}
      }
    };
  }, [sessionId, tableId]);

  // 2. Fallback por visibilidade (quando o usuário volta para a aba do navegador) e polling periódico
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onUpdateRef.current?.();
        onOrderUpdateRef.current?.();
        onSessionUpdateRef.current?.();
      }
    };

    const handleFocus = () => {
      onUpdateRef.current?.();
      onOrderUpdateRef.current?.();
      onSessionUpdateRef.current?.();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          onUpdateRef.current?.();
          onOrderUpdateRef.current?.();
        }
      }, pollIntervalMs);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return null;
}
