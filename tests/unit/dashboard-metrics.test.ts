import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDateRangeBoundaries,
  aggregateOrdersMetrics,
  getDashboardData,
  type DashboardData,
} from '@/lib/appwrite/dashboard';
import type { OrderDocument } from '@/lib/appwrite/orders';

const mockListDocuments = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: {
      listDocuments: mockListDocuments,
      updateDocument: mockUpdateDocument,
    },
  }),
}));

describe('Dashboard Metrics & Aggregation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDateRangeBoundaries', () => {
    // Referência fixa para teste: 2026-11-05T14:30:00.000Z (11:30 no fuso de Brasília UTC-3)
    const fixedNow = new Date('2026-11-05T14:30:00.000Z');

    it('retorna os limites corretos para "today" considerando UTC-3', () => {
      const { startDateIso, endDateIso } = getDateRangeBoundaries('today', fixedNow);

      expect(new Date(startDateIso).getTime()).toBeLessThan(new Date(endDateIso).getTime());
      // No fuso de Brasília, ambos são no dia 2026-11-05
      const startParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(startDateIso));
      const endParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(endDateIso));
      expect(startParts).toBe('2026-11-05');
      expect(endParts).toBe('2026-11-05');
    });

    it('retorna os limites corretos para "yesterday" no dia anterior', () => {
      const { startDateIso, endDateIso } = getDateRangeBoundaries('yesterday', fixedNow);

      const startParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(startDateIso));
      const endParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(endDateIso));
      expect(startParts).toBe('2026-11-04');
      expect(endParts).toBe('2026-11-04');
    });

    it('retorna 7 dias para "7d"', () => {
      const { startDateIso, endDateIso } = getDateRangeBoundaries('7d', fixedNow);

      const start = new Date(startDateIso);
      const end = new Date(endDateIso);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(7);
      expect(startDateIso).toContain('2026-10-30');
    });

    it('usa "today" como fallback para parâmetros inválidos', () => {
      const fallback = getDateRangeBoundaries('invalid' as any, fixedNow);
      const today = getDateRangeBoundaries('today', fixedNow);

      expect(fallback.startDateIso).toBe(today.startDateIso);
    });
  });

  describe('aggregateOrdersMetrics', () => {
    const fixedNow = new Date('2026-11-05T14:30:00.000Z');

    it('lida com lista vazia de pedidos sem divisão por zero', () => {
      const result = aggregateOrdersMetrics([], 'today', fixedNow);

      expect(result.metrics.totalRevenue).toBe(0);
      expect(result.metrics.averageTicket).toBe(0);
      expect(result.metrics.uniqueSessionsCount).toBe(0);
      expect(result.metrics.totalItemsCount).toBe(0);
      expect(result.topProducts).toEqual([]);
      expect(result.salesOverTime.length).toBe(24);
    });

    it('agrega faturamento, ticket médio por comanda única e ignora pedidos cancelados', () => {
      const orders = [
        {
          $id: 'ord_1',
          sessionId: 'sess_A',
          productId: 'prod_burger',
          productName: 'Burger Duplo',
          unitPrice: 35,
          quantity: 2,
          totalPrice: 70,
          status: 'delivered',
          createdAt: '2026-11-05T12:15:00.000Z',
        },
        {
          $id: 'ord_2',
          sessionId: 'sess_A',
          productId: 'prod_coke',
          productName: 'Refrigerante',
          unitPrice: 10,
          quantity: 1,
          totalPrice: 10,
          status: 'delivered',
          createdAt: '2026-11-05T12:20:00.000Z',
        },
        {
          $id: 'ord_3',
          sessionId: 'sess_B',
          productId: 'prod_burger',
          productName: 'Burger Duplo',
          unitPrice: 35,
          quantity: 1,
          totalPrice: 35,
          status: 'preparing',
          createdAt: '2026-11-05T13:00:00.000Z',
        },
        {
          $id: 'ord_4',
          sessionId: 'sess_C',
          productId: 'prod_beer',
          productName: 'Cerveja',
          unitPrice: 15,
          quantity: 2,
          totalPrice: 30,
          status: 'cancelled', // Deve ser ignorado
          createdAt: '2026-11-05T13:10:00.000Z',
        },
      ] as OrderDocument[];

      const result = aggregateOrdersMetrics(orders, 'today', fixedNow);

      // Total de válidos = 70 + 10 + 35 = 115
      expect(result.metrics.totalRevenue).toBe(115);
      // Comandas únicas válidas = sess_A e sess_B = 2
      expect(result.metrics.uniqueSessionsCount).toBe(2);
      // Ticket Médio = 115 / 2 = 57.5
      expect(result.metrics.averageTicket).toBe(57.5);
      // Total de itens = 2 + 1 + 1 = 4
      expect(result.metrics.totalItemsCount).toBe(4);
    });

    it('ordena o Top 5 de produtos primariamente por faturamento decrescente', () => {
      const orders = [
        // Água: 10 unidades x R$ 5 = R$ 50
        {
          $id: '1',
          sessionId: 's1',
          productId: 'prod_water',
          productName: 'Água Mineral',
          totalPrice: 50,
          quantity: 10,
          status: 'delivered',
          createdAt: '2026-11-05T12:00:00.000Z',
        },
        // Picanha: 2 unidades x R$ 90 = R$ 180 (maior receita, apesar de menor qtd)
        {
          $id: '2',
          sessionId: 's2',
          productId: 'prod_steak',
          productName: 'Picanha na Chapa',
          totalPrice: 180,
          quantity: 2,
          status: 'delivered',
          createdAt: '2026-11-05T12:00:00.000Z',
        },
        // Burger: 3 unidades x R$ 40 = R$ 120
        {
          $id: '3',
          sessionId: 's3',
          productId: 'prod_burger',
          productName: 'Burger Especial',
          totalPrice: 120,
          quantity: 3,
          status: 'delivered',
          createdAt: '2026-11-05T12:00:00.000Z',
        },
      ] as OrderDocument[];

      const result = aggregateOrdersMetrics(orders, 'today', fixedNow);

      expect(result.topProducts.length).toBe(3);
      expect(result.topProducts[0].productId).toBe('prod_steak');
      expect(result.topProducts[0].revenue).toBe(180);
      expect(result.topProducts[1].productId).toBe('prod_burger');
      expect(result.topProducts[1].revenue).toBe(120);
      expect(result.topProducts[2].productId).toBe('prod_water');
      expect(result.topProducts[2].revenue).toBe(50);
    });

    it('gera 7 pontos temporais formatados para o período "7d"', () => {
      const orders = [
        {
          $id: '1',
          sessionId: 's1',
          productId: 'p1',
          productName: 'Item',
          totalPrice: 100,
          quantity: 1,
          status: 'delivered',
          createdAt: '2026-11-05T12:00:00.000Z',
        },
      ] as OrderDocument[];

      const result = aggregateOrdersMetrics(orders, '7d', fixedNow);

      expect(result.salesOverTime.length).toBe(7);
      const lastPoint = result.salesOverTime[result.salesOverTime.length - 1];
      expect(lastPoint.revenue).toBe(100);
    });
  });

  describe('getDashboardData', () => {
    it('busca e consolida pedidos, mesas ativas e chamados de serviço', async () => {
      const establishmentId = 'est_abc';

      // Mock orders list
      mockListDocuments
        .mockResolvedValueOnce({
          documents: [
            {
              $id: 'ord_1',
              sessionId: 's1',
              productId: 'p1',
              productName: 'Item 1',
              totalPrice: 80,
              quantity: 2,
              status: 'delivered',
              createdAt: '2026-11-05T12:00:00.000Z',
            },
          ],
          total: 1,
        })
        // Mock tables list
        .mockResolvedValueOnce({
          documents: [
            { $id: 'tbl_1', number: 1, status: 'occupied', isActive: true },
            { $id: 'tbl_2', number: 2, status: 'idle', isActive: true },
            { $id: 'tbl_3', number: 3, status: 'order_placed', isActive: true },
            { $id: 'tbl_4', number: 4, status: 'idle', isActive: false }, // inativa
          ],
          total: 4,
        })
        // Mock service calls list
        .mockResolvedValueOnce({
          documents: [
            {
              $id: 'call_1',
              tableNumber: 1,
              type: 'waiter',
              status: 'pending',
              requestedBy: 'João',
              $createdAt: '2026-11-05T12:10:00.000Z',
            },
          ],
          total: 1,
        });

      const data = await getDashboardData(establishmentId, 'today');

      expect(data.metrics.totalRevenue).toBe(80);
      expect(data.liveStatus.totalTables).toBe(3); // Apenas as ativas
      expect(data.liveStatus.occupiedTables).toBe(2); // tbl_1 e tbl_3
      expect(data.liveStatus.pendingServiceCallsCount).toBe(1);
      expect(data.recentServiceCalls.length).toBe(1);
    });
  });
});
