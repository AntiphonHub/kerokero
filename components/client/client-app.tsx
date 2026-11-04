'use client';

import React, { useState, useCallback } from 'react';
import type { ProductDocument, CategoryDocument } from '@/lib/appwrite/products';
import type { OrderDocument } from '@/lib/appwrite/orders';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';
import { parseSessionParticipants } from '@/lib/utils/tab';
import { getTableTabDataAction, clearClientSessionAction } from '@/actions/client';
import { MenuView } from './menu-view';
import { TabView } from './tab-view';
import { RealtimeListener } from './realtime-listener';
import { PixModal } from './pix-modal';
import { ReceiptView } from './receipt-view';
import type { PixPaymentMode } from '@/lib/utils/pix';
import { UtensilsCrossed, Receipt } from 'lucide-react';

export interface ClientAppProps {
  initialSession: TableSessionDocument | null;
  initialOrders: OrderDocument[];
  products: ProductDocument[];
  categories: CategoryDocument[];
  tableToken: string;
  tableLabel?: string;
  establishmentName?: string;
  currentParticipantId: string;
  currentParticipantName: string;
  tableNumber: number;
  isHappyHour?: boolean;
}

export function ClientApp({
  initialSession,
  initialOrders,
  products,
  categories,
  tableToken,
  tableLabel,
  establishmentName,
  currentParticipantId,
  currentParticipantName,
  tableNumber,
  isHappyHour = false,
}: ClientAppProps) {
  const [activeScreen, setActiveScreen] = useState<'menu' | 'tab'>('menu');
  const [orders, setOrders] = useState<OrderDocument[]>(initialOrders);
  const [session, setSession] = useState<TableSessionDocument | null>(initialSession);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados do Modal PIX e Tela de Comprovante Quitado
  const [isPixOpen, setIsPixOpen] = useState(false);
  const [pixMode, setPixMode] = useState<PixPaymentMode>('my_items');
  const [receiptData, setReceiptData] = useState<{
    amountCents: number;
    mode: PixPaymentMode;
    paymentId: string;
    paidAt: string;
  } | null>(null);

  // Revalidação dos dados da comanda (via WebSocket, visibilidade ou manual)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getTableTabDataAction();
      if (res.success && res.data) {
        setOrders(res.data.orders);
        if (res.data.session) {
          setSession(res.data.session);
        }
      }
    } catch (err) {
      console.warn('[ClientApp] Erro ao sincronizar dados da mesa:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Quando um pedido é finalizado com sucesso no carrinho
  const handleOrderSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Abertura do modal de pagamento PIX
  const handlePayTab = (mode: 'my_items' | 'split' | 'total') => {
    setPixMode(mode);
    setIsPixOpen(true);
  };

  // Quando o polling do modal confirma quitação no Asaas
  const handlePaymentComplete = (data: {
    amountCents: number;
    mode: PixPaymentMode;
    paymentId: string;
    paidAt: string;
  }) => {
    setIsPixOpen(false);
    setReceiptData(data);
  };

  // Se o participante concluiu o pagamento via PIX ou se o garçom quitou e fechou a mesa no painel
  const isSessionClosed = session?.status === 'closed' || initialSession?.status === 'closed';

  if (receiptData || isSessionClosed) {
    const currentParticipant = session?.participants
      ? parseSessionParticipants(session.participants).find(
          (p) => p.id === currentParticipantId || p.name === currentParticipantName,
        )
      : null;

    const resolvedAmountCents =
      receiptData?.amountCents ??
      (currentParticipant?.paidAmount
        ? Math.round(currentParticipant.paidAmount)
        : session?.totalAmount
          ? Math.round(session.totalAmount)
          : 0);

    const handleFinish = async () => {
      try {
        await clearClientSessionAction();
      } catch (err) {
        console.warn('[ClientApp] Erro ao limpar sessão local:', err);
      }
      window.location.reload();
    };

    return (
      <ReceiptView
        amountCents={resolvedAmountCents}
        mode={receiptData?.mode ?? 'total'}
        paymentMethodLabel={
          receiptData
            ? 'Liquidado via PIX Dinâmico'
            : 'Liquidado na Maquininha / Garçom'
        }
        participantName={currentParticipantName}
        tableNumber={tableNumber}
        tableLabel={tableLabel}
        paidAt={receiptData?.paidAt ?? session?.closedAt ?? new Date().toISOString()}
        onFinish={handleFinish}
      />
    );
  }

  const activeOrdersCount = orders.filter((o) => o.status !== 'cancelled').length;

  return (
    <div className="flex flex-col flex-1 relative min-h-full">
      {/* Realtime WebSocket & Background Polling Listener */}
      <RealtimeListener
        sessionId={session?.$id || initialSession?.$id}
        tableId={session?.tableId}
        onUpdate={handleRefresh}
      />

      {/* Screen Views */}
      <div className="flex-1 flex flex-col">
        {activeScreen === 'menu' ? (
          <MenuView
            products={products}
            categories={categories}
            tableToken={tableToken}
            tableLabel={tableLabel}
            establishmentName={establishmentName}
            participantName={currentParticipantName}
            onOrderSuccess={handleOrderSuccess}
            onServiceCalled={handleRefresh}
            bottomBarOffset={true}
            isHappyHour={isHappyHour}
          />
        ) : (
          <TabView
            orders={orders}
            session={session}
            currentParticipantId={currentParticipantId}
            currentParticipantName={currentParticipantName}
            tableNumber={tableNumber}
            tableLabel={tableLabel}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onPayTab={handlePayTab}
            onOpenPayment={handlePayTab}
          />
        )}
      </div>

      {/* Modal de Pagamento PIX e Polling */}
      <PixModal
        isOpen={isPixOpen}
        onClose={() => setIsPixOpen(false)}
        orders={orders}
        session={session}
        currentParticipantId={currentParticipantId}
        currentParticipantName={currentParticipantName}
        tableNumber={tableNumber}
        initialMode={pixMode}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Fixed Bottom Navigation: Cardápio vs Comanda */}
      <nav
        aria-label="Navegação da mesa"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 safe-area-bottom"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
          {/* Cardápio Button */}
          <button
            type="button"
            onClick={() => setActiveScreen('menu')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
              activeScreen === 'menu'
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-600 font-medium'
            }`}
          >
            <UtensilsCrossed
              className={`size-5 mb-1 ${activeScreen === 'menu' ? 'stroke-[2.5]' : ''}`}
            />
            <span className="text-[11px] tracking-tight">Cardápio</span>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-zinc-200/80" />

          {/* Comanda Button */}
          <button
            type="button"
            onClick={() => setActiveScreen('tab')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors relative ${
              activeScreen === 'tab'
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-600 font-medium'
            }`}
          >
            <div className="relative">
              <Receipt
                className={`size-5 mb-1 ${activeScreen === 'tab' ? 'stroke-[2.5]' : ''}`}
              />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center shadow-2xs">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight">Comanda</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
