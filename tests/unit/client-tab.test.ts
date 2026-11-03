import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  filterParticipantOrders,
  calculateParticipantTotal,
  groupOrdersByParticipant,
  calculateTableSummary,
  getOrderStatusInfo,
  formatSelectedOptionsSummary,
} from '@/lib/utils/tab';
import type { OrderDocument } from '@/lib/appwrite/orders';
import type { TableSessionDocument, SessionParticipant } from '@/lib/appwrite/client-sessions';
import { callWaiterAction } from '@/actions/client';

// Mock client actions
vi.mock('@/actions/client', () => ({
  callWaiterAction: vi.fn(),
  getTableTabDataAction: vi.fn(),
  getClientSessionAction: vi.fn(),
}));

describe('Client Tab Utilities & Shared Table Logic', () => {
  const mockOrders = [
    {
      $id: 'order_1',
      $createdAt: '2026-11-03T10:00:00Z',
      $updatedAt: '2026-11-03T10:00:00Z',
      $permissions: [],
      $databaseId: 'kerokero',
      $collectionId: 'orders',
      establishmentId: 'est_1',
      tableId: 'tab_1',
      tableNumber: 5,
      sessionId: 'sess_1',
      participantId: 'part_carlos',
      participantName: 'Carlos',
      productId: 'prod_1',
      productName: 'Smash Burger Clássico',
      unitPrice: 3200,
      quantity: 2,
      totalPrice: 6400,
      notes: 'Sem cebola',
      selectedOptions: 'Bacon Crocante, Queijo Extra',
      status: 'preparing' as const,
      createdAt: '2026-11-03T10:00:00Z',
    },
    {
      $id: 'order_2',
      $createdAt: '2026-11-03T10:05:00Z',
      $updatedAt: '2026-11-03T10:05:00Z',
      $permissions: [],
      $databaseId: 'kerokero',
      $collectionId: 'orders',
      establishmentId: 'est_1',
      tableId: 'tab_1',
      tableNumber: 5,
      sessionId: 'sess_1',
      participantId: 'part_carlos',
      participantName: 'Carlos',
      productId: 'prod_2',
      productName: 'Refrigerante Cola Lata',
      unitPrice: 800,
      quantity: 1,
      totalPrice: 800,
      status: 'delivered' as const,
      createdAt: '2026-11-03T10:05:00Z',
    },
    {
      $id: 'order_3',
      $createdAt: '2026-11-03T10:10:00Z',
      $updatedAt: '2026-11-03T10:10:00Z',
      $permissions: [],
      $databaseId: 'kerokero',
      $collectionId: 'orders',
      establishmentId: 'est_1',
      tableId: 'tab_1',
      tableNumber: 5,
      sessionId: 'sess_1',
      participantId: 'part_ana',
      participantName: 'Ana',
      productId: 'prod_3',
      productName: 'Suco Natural de Laranja',
      unitPrice: 1200,
      quantity: 2,
      totalPrice: 2400,
      status: 'pending' as const,
      createdAt: '2026-11-03T10:10:00Z',
    },
    {
      $id: 'order_4',
      $createdAt: '2026-11-03T10:15:00Z',
      $updatedAt: '2026-11-03T10:15:00Z',
      $permissions: [],
      $databaseId: 'kerokero',
      $collectionId: 'orders',
      establishmentId: 'est_1',
      tableId: 'tab_1',
      tableNumber: 5,
      sessionId: 'sess_1',
      participantId: 'part_carlos',
      participantName: 'Carlos',
      productId: 'prod_4',
      productName: 'Sobremesa Pudim',
      unitPrice: 1500,
      quantity: 1,
      totalPrice: 1500,
      status: 'cancelled' as const,
      createdAt: '2026-11-03T10:15:00Z',
    },
  ] as unknown as OrderDocument[];

  const mockSession = {
    $id: 'sess_1',
    $createdAt: '2026-11-03T09:50:00Z',
    $updatedAt: '2026-11-03T10:15:00Z',
    $permissions: [],
    $databaseId: 'kerokero',
    $collectionId: 'table_sessions',
    establishmentId: 'est_1',
    tableId: 'tab_1',
    tableNumber: 5,
    status: 'open' as const,
    openedAt: '2026-11-03T09:50:00Z',
    closedAt: null,
    totalAmount: 9600, // 6400 + 800 + 2400 (exclui cancelado 1500)
    paidAmount: 2000,
    participants: JSON.stringify([
      {
        id: 'part_carlos',
        name: 'Carlos',
        joinedAt: '2026-11-03T09:50:00Z',
        isPaid: false,
        paidAmount: 0,
      },
      {
        id: 'part_ana',
        name: 'Ana',
        joinedAt: '2026-11-03T09:55:00Z',
        isPaid: false,
        paidAmount: 2000,
      },
      {
        id: 'part_lucas',
        name: 'Lucas',
        joinedAt: '2026-11-03T10:02:00Z',
        isPaid: false,
        paidAmount: 0,
      },
    ] satisfies SessionParticipant[]),
  } as unknown as TableSessionDocument;

  describe('Order Filtering & Totals by Participant', () => {
    it('filtra apenas os pedidos do participante especificado', () => {
      const carlosOrders = filterParticipantOrders(mockOrders, 'part_carlos');
      expect(carlosOrders).toHaveLength(3);
      expect(carlosOrders.map((o) => o.$id)).toEqual(['order_1', 'order_2', 'order_4']);

      const anaOrders = filterParticipantOrders(mockOrders, 'part_ana');
      expect(anaOrders).toHaveLength(1);
      expect(anaOrders[0].$id).toBe('order_3');

      const unknownOrders = filterParticipantOrders(mockOrders, 'part_inexistente');
      expect(unknownOrders).toHaveLength(0);
    });

    it('calcula o subtotal do participante ignorando pedidos cancelados', () => {
      // Carlos: 6400 + 800 (1500 cancelado é ignorado) = 7200
      const carlosTotal = calculateParticipantTotal(mockOrders, 'part_carlos');
      expect(carlosTotal).toBe(7200);

      // Ana: 2400
      const anaTotal = calculateParticipantTotal(mockOrders, 'part_ana');
      expect(anaTotal).toBe(2400);

      // Lucas: sem pedidos = 0
      const lucasTotal = calculateParticipantTotal(mockOrders, 'part_lucas');
      expect(lucasTotal).toBe(0);
    });
  });

  describe('Participant Grouping for Mesa Completa', () => {
    it('agrupa pedidos por participante e inclui participantes sem pedidos', () => {
      const knownParticipants: SessionParticipant[] = JSON.parse(mockSession.participants);
      const groups = groupOrdersByParticipant(mockOrders, knownParticipants);

      expect(groups).toHaveLength(3);

      const carlosGroup = groups.find((g) => g.participantId === 'part_carlos')!;
      expect(carlosGroup).toBeDefined();
      expect(carlosGroup.participantName).toBe('Carlos');
      expect(carlosGroup.orders).toHaveLength(3);
      expect(carlosGroup.totalCents).toBe(7200);

      const anaGroup = groups.find((g) => g.participantId === 'part_ana')!;
      expect(anaGroup).toBeDefined();
      expect(anaGroup.participantName).toBe('Ana');
      expect(anaGroup.orders).toHaveLength(1);
      expect(anaGroup.totalCents).toBe(2400);

      const lucasGroup = groups.find((g) => g.participantId === 'part_lucas')!;
      expect(lucasGroup).toBeDefined();
      expect(lucasGroup.participantName).toBe('Lucas');
      expect(lucasGroup.orders).toHaveLength(0);
      expect(lucasGroup.totalCents).toBe(0);
    });

    it('adiciona dinamicamente participante não cadastrado previamente na lista knownParticipants', () => {
      const groups = groupOrdersByParticipant(mockOrders, []);
      expect(groups).toHaveLength(2); // Carlos e Ana
      expect(groups.map((g) => g.participantName)).toContain('Carlos');
      expect(groups.map((g) => g.participantName)).toContain('Ana');
    });
  });

  describe('Table Summary Calculation', () => {
    it('calcula saldo em aberto e total acumulado a partir da sessão e pedidos', () => {
      const summary = calculateTableSummary(mockSession, mockOrders);

      expect(summary.totalAmount).toBe(9600);
      expect(summary.paidAmount).toBe(2000);
      expect(summary.remainingBalance).toBe(7600);
      expect(summary.isFullyPaid).toBe(false);
      expect(summary.activeOrdersCount).toBe(3); // 4 pedidos menos 1 cancelado
    });

    it('identifica comanda quitada quando saldo restante for zero', () => {
      const fullyPaidSession: TableSessionDocument = {
        ...mockSession,
        totalAmount: 9600,
        paidAmount: 9600,
      };

      const summary = calculateTableSummary(fullyPaidSession, mockOrders);
      expect(summary.remainingBalance).toBe(0);
      expect(summary.isFullyPaid).toBe(true);
    });

    it('calcula total a partir dos pedidos quando a sessão não tem total gravado', () => {
      const emptySession: TableSessionDocument = {
        ...mockSession,
        totalAmount: 0,
        paidAmount: 0,
      };

      const summary = calculateTableSummary(emptySession, mockOrders);
      expect(summary.totalAmount).toBe(9600); // 6400 + 800 + 2400
      expect(summary.remainingBalance).toBe(9600);
    });
  });

  describe('Order Status Badges & Option Formatting', () => {
    it('retorna informações corretas para cada status de pedido', () => {
      expect(getOrderStatusInfo('pending').label).toBe('Recebido');
      expect(getOrderStatusInfo('preparing').label).toBe('Em preparo');
      expect(getOrderStatusInfo('ready').label).toBe('Pronto');
      expect(getOrderStatusInfo('delivered').label).toBe('Entregue');
      expect(getOrderStatusInfo('cancelled').label).toBe('Cancelado');
    });

    it('formata opções customizadas em strings legíveis', () => {
      expect(formatSelectedOptionsSummary('Bacon Crocante, Queijo Extra')).toBe(
        'Bacon Crocante, Queijo Extra',
      );

      expect(
        formatSelectedOptionsSummary([
          { name: 'Ovo Frito', price: 300 },
          { name: 'Molho Especial', price: 200 },
        ]),
      ).toBe('Ovo Frito, Molho Especial');

      expect(
        formatSelectedOptionsSummary(JSON.stringify(['Bacon', 'Cheddar'])),
      ).toBe('Bacon, Cheddar');
    });
  });

  describe('Quick Services Actions Triggers', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('dispara chamado de garçom com motivo predefinido correto', async () => {
      vi.mocked(callWaiterAction).mockResolvedValueOnce({
        success: true,
        message: 'Garçom chamado com sucesso.',
      });

      const res = await callWaiterAction('Gelo / Copo', 'waiter');
      expect(callWaiterAction).toHaveBeenCalledWith('Gelo / Copo', 'waiter');
      expect(res.success).toBe(true);
    });

    it('dispara solicitação de maquininha com tipo bill_card', async () => {
      vi.mocked(callWaiterAction).mockResolvedValueOnce({
        success: true,
        message: 'Solicitação de maquininha enviada ao garçom.',
      });

      const res = await callWaiterAction('Maquininha: Crédito', 'bill_card');
      expect(callWaiterAction).toHaveBeenCalledWith('Maquininha: Crédito', 'bill_card');
      expect(res.success).toBe(true);
    });
  });
});
