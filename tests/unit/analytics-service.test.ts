import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAnalyticsDateRangeBoundaries,
  aggregateAnalyticsMetrics,
  getAnalyticsData,
  type AnalyticsRange,
} from '@/lib/appwrite/analytics';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';
import type { OrderDocument } from '@/lib/appwrite/orders';

const mockListDocuments = vi.fn();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: {
      listDocuments: mockListDocuments,
    },
  }),
}));

describe('Analytics & Business Intelligence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnalyticsDateRangeBoundaries', () => {
    const fixedNow = new Date('2026-11-05T14:30:00.000Z'); // 11:30 no fuso de Brasília UTC-3

    it('retorna os limites corretos para "today" em UTC-3', () => {
      const { startDateIso, endDateIso } = getAnalyticsDateRangeBoundaries('today', fixedNow);
      const startParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(startDateIso));
      const endParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(endDateIso));
      expect(startParts).toBe('2026-11-05');
      expect(endParts).toBe('2026-11-05');
    });

    it('retorna os limites corretos para "this_month" iniciando no dia 1 do mês corrente', () => {
      const { startDateIso, endDateIso } = getAnalyticsDateRangeBoundaries('this_month', fixedNow);
      const startParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(startDateIso));
      const endParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(endDateIso));
      expect(startParts).toBe('2026-11-01');
      expect(endParts).toBe('2026-11-05');
    });

    it('retorna os limites para "30d"', () => {
      const { startDateIso, endDateIso } = getAnalyticsDateRangeBoundaries('30d', fixedNow);
      const d = Math.round((new Date(endDateIso).getTime() - new Date(startDateIso).getTime()) / (1000 * 60 * 60 * 24));
      expect(d).toBeGreaterThanOrEqual(29);
    });
  });

  describe('aggregateAnalyticsMetrics', () => {
    const fixedNow = new Date('2026-11-05T14:30:00.000Z');

    it('trata lista vazia sem divisão por zero', () => {
      const result = aggregateAnalyticsMetrics([], [], 'today', fixedNow);
      expect(result.kpis.totalRevenue).toBe(0);
      expect(result.kpis.pixAsaasRevenue).toBe(0);
      expect(result.kpis.posMachineRevenue).toBe(0);
      expect(result.kpis.averageTicketPerTable).toBe(0);
      expect(result.kpis.averageTicketPerCustomer).toBe(0);
      expect(result.kpis.averageStayMinutes).toBe(0);
      expect(result.kpis.formattedStayDuration).toBe('0 min');
      expect(result.categoryDistribution).toEqual([]);
      expect(result.topProducts).toEqual([]);
    });

    it('calcula KPIs financeiros com soma exata e ticket médio por mesa e por cliente', () => {
      const sessions = [
        // Sessão 1: 2 clientes, R$ 200 (R$ 100 PIX, R$ 100 POS), permanência de 60 min
        {
          $id: 's1',
          status: 'closed',
          totalAmount: 20000,
          paidAmount: 20000,
          pixPaidAmount: 10000,
          posPaidAmount: 10000,
          paymentMethod: 'mixed',
          participants: JSON.stringify([{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }]),
          openedAt: '2026-11-05T11:00:00.000Z',
          closedAt: '2026-11-05T12:00:00.000Z',
        },
        // Sessão 2: 1 cliente, R$ 100 (100% POS), permanência de 30 min
        {
          $id: 's2',
          status: 'closed',
          totalAmount: 10000,
          paidAmount: 10000,
          pixPaidAmount: 0,
          posPaidAmount: 10000,
          paymentMethod: 'pos_card',
          participants: JSON.stringify([{ id: 'p3', name: 'C' }]),
          openedAt: '2026-11-05T12:00:00.000Z',
          closedAt: '2026-11-05T12:30:00.000Z',
        },
      ] as TableSessionDocument[];

      const orders = [
        {
          $id: 'o1',
          sessionId: 's1',
          productId: 'p_burger',
          productName: 'Smash Burger',
          quantity: 2,
          unitPrice: 7500,
          totalPrice: 15000,
          status: 'delivered',
          createdAt: '2026-11-05T11:15:00.000Z',
        },
        {
          $id: 'o2',
          sessionId: 's1',
          productId: 'p_beer',
          productName: 'Chopp Artesanal',
          quantity: 2,
          unitPrice: 2500,
          totalPrice: 5000,
          status: 'delivered',
          createdAt: '2026-11-05T11:20:00.000Z',
        },
        {
          $id: 'o3',
          sessionId: 's2',
          productId: 'p_burger',
          productName: 'Smash Burger',
          quantity: 1,
          unitPrice: 7500,
          totalPrice: 7500,
          status: 'delivered',
          createdAt: '2026-11-05T12:05:00.000Z',
        },
        {
          $id: 'o4',
          sessionId: 's2',
          productId: 'p_soda',
          productName: 'Refrigerante',
          quantity: 1,
          unitPrice: 2500,
          totalPrice: 2500,
          status: 'delivered',
          createdAt: '2026-11-05T12:05:00.000Z',
        },
      ] as OrderDocument[];

      const result = aggregateAnalyticsMetrics(sessions, orders, 'today', fixedNow);

      // Faturamento Total = R$ 300 (30000 centavos)
      expect(result.kpis.totalRevenue).toBe(30000);
      expect(result.kpis.pixAsaasRevenue).toBe(10000);
      expect(result.kpis.posMachineRevenue).toBe(20000);
      expect(result.kpis.pixAsaasRevenue + result.kpis.posMachineRevenue).toBe(result.kpis.totalRevenue);
      expect(result.kpis.pixPercentage).toBe(33);
      expect(result.kpis.posPercentage).toBe(67);

      // Ticket Médio por Mesa = 30000 / 2 mesas = 15000 (R$ 150,00)
      expect(result.kpis.averageTicketPerTable).toBe(15000);

      // Ticket Médio por Cliente = 30000 / 3 clientes = 10000 (R$ 100,00)
      expect(result.kpis.averageTicketPerCustomer).toBe(10000);

      // Tempo de permanência: (60 + 30) / 2 = 45 min
      expect(result.kpis.averageStayMinutes).toBe(45);
      expect(result.kpis.formattedStayDuration).toBe('45 min');

      // Top produtos: Smash Burger deve ser o 1º (R$ 225 faturado)
      expect(result.topProducts[0].productId).toBe('p_burger');
      expect(result.topProducts[0].revenue).toBe(22500);
      expect(result.topProducts[0].quantity).toBe(3);
    });
  });

  describe('getAnalyticsData', () => {
    it('busca sessões e pedidos e consolida a resposta', async () => {
      mockListDocuments
        // 1. tableSessions
        .mockResolvedValueOnce({
          documents: [
            {
              $id: 's1',
              establishmentId: 'est_1',
              status: 'closed',
              totalAmount: 10000,
              paidAmount: 10000,
              pixPaidAmount: 10000,
              posPaidAmount: 0,
              paymentMethod: 'pix_asaas',
              participants: JSON.stringify([{ id: 'p1', name: 'Ana' }]),
              openedAt: '2026-11-05T12:00:00.000Z',
              closedAt: '2026-11-05T13:15:00.000Z',
            },
          ],
          total: 1,
        })
        // 2. products (para categorias)
        .mockResolvedValueOnce({
          documents: [
            { $id: 'p1', name: 'Combo', categoryName: 'Combos Especiais' },
          ],
          total: 1,
        })
        // 3. orders associadas
        .mockResolvedValueOnce({
          documents: [
            {
              $id: 'o1',
              sessionId: 's1',
              productId: 'p1',
              productName: 'Combo',
              unitPrice: 10000,
              quantity: 1,
              totalPrice: 10000,
              status: 'delivered',
              createdAt: '2026-11-05T12:10:00.000Z',
            },
          ],
          total: 1,
        });

      const data = await getAnalyticsData('est_1', 'today');

      expect(data.kpis.totalRevenue).toBe(10000);
      expect(data.kpis.formattedStayDuration).toBe('1h 15min');
      expect(data.topProducts.length).toBe(1);
    });
  });
});
