import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getHistoryDateRangeBoundaries,
  aggregateHistoryTotals,
  filterHistorySessions,
  getOrdersHistoryData,
  type HistoryRange,
} from '@/lib/appwrite/orders-history';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';

const mockListDocuments = vi.fn();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: {
      listDocuments: mockListDocuments,
    },
  }),
}));

describe('Orders History Service & Accounting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHistoryDateRangeBoundaries', () => {
    const fixedNow = new Date('2026-11-05T14:30:00.000Z');

    it('retorna os limites corretos para "today" em UTC-3', () => {
      const { startDateIso, endDateIso } = getHistoryDateRangeBoundaries('today', fixedNow);
      const startParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(startDateIso));
      const endParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(endDateIso));
      expect(startParts).toBe('2026-11-05');
      expect(endParts).toBe('2026-11-05');
    });

    it('retorna limites para "yesterday"', () => {
      const { startDateIso, endDateIso } = getHistoryDateRangeBoundaries('yesterday', fixedNow);
      const startParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(startDateIso));
      const endParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(endDateIso));
      expect(startParts).toBe('2026-11-04');
      expect(endParts).toBe('2026-11-04');
    });

    it('retorna limites para "7d" e "30d"', () => {
      const b7 = getHistoryDateRangeBoundaries('7d', fixedNow);
      const b30 = getHistoryDateRangeBoundaries('30d', fixedNow);

      const d7 = Math.round((new Date(b7.endDateIso).getTime() - new Date(b7.startDateIso).getTime()) / (1000 * 60 * 60 * 24));
      const d30 = Math.round((new Date(b30.endDateIso).getTime() - new Date(b30.startDateIso).getTime()) / (1000 * 60 * 60 * 24));

      expect(d7).toBeGreaterThanOrEqual(6);
      expect(d30).toBeGreaterThanOrEqual(29);
    });
  });

  describe('aggregateHistoryTotals', () => {
    it('garante integridade contábil matemática (total === pix + pos)', () => {
      const sessions = [
        // Sessão 1: R$ 100 100% no PIX
        {
          $id: 's1',
          status: 'closed',
          totalAmount: 10000,
          paidAmount: 10000,
          pixPaidAmount: 10000,
          posPaidAmount: 0,
          paymentMethod: 'pix_asaas',
        },
        // Sessão 2: R$ 150 100% na Maquininha
        {
          $id: 's2',
          status: 'closed',
          totalAmount: 15000,
          paidAmount: 15000,
          pixPaidAmount: 0,
          posPaidAmount: 15000,
          paymentMethod: 'pos_card',
        },
        // Sessão 3: R$ 200 Híbrido (R$ 50 no PIX + R$ 150 na Maquininha)
        {
          $id: 's3',
          status: 'closed',
          totalAmount: 20000,
          paidAmount: 20000,
          pixPaidAmount: 5000,
          posPaidAmount: 15000,
          paymentMethod: 'mixed',
        },
        // Sessão 4 legada (sem pixPaidAmount/posPaidAmount): R$ 80 na Maquininha
        {
          $id: 's4',
          status: 'closed',
          totalAmount: 8000,
          paidAmount: 8000,
          paymentMethod: 'pos_card',
        },
      ] as TableSessionDocument[];

      const totals = aggregateHistoryTotals(sessions);

      // Total = 100 + 150 + 200 + 80 = 530 (53000 centavos)
      expect(totals.totalRevenue).toBe(53000);
      // PIX = 100 + 50 = 150 (15000 centavos)
      expect(totals.pixAsaasRevenue).toBe(15000);
      // Maquininha = 150 + 150 + 80 = 380 (38000 centavos)
      expect(totals.posMachineRevenue).toBe(38000);
      // Soma bate perfeitamente
      expect(totals.pixAsaasRevenue + totals.posMachineRevenue).toBe(totals.totalRevenue);
      expect(totals.sessionsCount).toBe(4);
    });

    it('trata lista vazia sem divisão por zero', () => {
      const totals = aggregateHistoryTotals([]);
      expect(totals.totalRevenue).toBe(0);
      expect(totals.pixAsaasRevenue).toBe(0);
      expect(totals.posMachineRevenue).toBe(0);
      expect(totals.sessionsCount).toBe(0);
    });
  });

  describe('filterHistorySessions', () => {
    const sessions = [
      {
        $id: 's1',
        tableNumber: 4,
        paymentMethod: 'pix_asaas',
        participants: JSON.stringify([{ id: 'p1', name: 'Carlos Silva' }]),
      },
      {
        $id: 's2',
        tableNumber: 12,
        paymentMethod: 'pos_card',
        participants: JSON.stringify([{ id: 'p2', name: 'Mariana Costa' }]),
      },
    ] as TableSessionDocument[];

    it('filtra por método de pagamento', () => {
      const pixOnly = filterHistorySessions(sessions, { paymentMethod: 'pix_asaas' });
      expect(pixOnly.length).toBe(1);
      expect(pixOnly[0].$id).toBe('s1');

      const posOnly = filterHistorySessions(sessions, { paymentMethod: 'pos_card' });
      expect(posOnly.length).toBe(1);
      expect(posOnly[0].$id).toBe('s2');
    });

    it('filtra por busca textual por mesa ou participante', () => {
      const byTable = filterHistorySessions(sessions, { search: '4' });
      expect(byTable.length).toBe(1);
      expect(byTable[0].tableNumber).toBe(4);

      const byName = filterHistorySessions(sessions, { search: 'Mariana' });
      expect(byName.length).toBe(1);
      expect(byName[0].$id).toBe('s2');
    });
  });

  describe('getOrdersHistoryData', () => {
    it('busca sessões fechadas e consolida itens associados', async () => {
      const establishmentId = 'est_123';

      mockListDocuments
        // Retorno de tableSessions
        .mockResolvedValueOnce({
          documents: [
            {
              $id: 'sess_1',
              establishmentId,
              tableId: 't1',
              tableNumber: 2,
              status: 'closed',
              totalAmount: 5000,
              paidAmount: 5000,
              pixPaidAmount: 5000,
              posPaidAmount: 0,
              paymentMethod: 'pix_asaas',
              participants: JSON.stringify([{ id: 'p1', name: 'Lucas' }]),
              closedAt: '2026-11-05T13:00:00.000Z',
            },
          ],
          total: 1,
        })
        // Retorno de orders associadas
        .mockResolvedValueOnce({
          documents: [
            {
              $id: 'ord_1',
              sessionId: 'sess_1',
              tableNumber: 2,
              participantName: 'Lucas',
              productName: 'Burger',
              unitPrice: 5000,
              quantity: 1,
              totalPrice: 5000,
              status: 'delivered',
              createdAt: '2026-11-05T12:30:00.000Z',
            },
          ],
          total: 1,
        });

      const result = await getOrdersHistoryData(establishmentId, { range: 'today' });

      expect(result.summary.totalRevenue).toBe(5000);
      expect(result.summary.pixAsaasRevenue).toBe(5000);
      expect(result.summary.posMachineRevenue).toBe(0);
      expect(result.sessions.length).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].productName).toBe('Burger');
      expect(result.items[0].paymentMethod).toBe('pix_asaas');
    });
  });
});
