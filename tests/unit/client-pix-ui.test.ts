import { describe, it, expect } from 'vitest';
import { isValidCpf, formatCpf } from '@/lib/validators/cpf';
import { formatPriceCents } from '@/lib/utils/formatters';
import {
  calculatePixAmounts,
  formatPixCountdown,
  PIX_MODE_DETAILS,
} from '@/lib/utils/pix';
import type { OrderDocument } from '@/lib/appwrite/orders';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';

describe('Client PIX UI & Helpers', () => {
  describe('CPF Validation and Masking', () => {
    it('validates authentic CPFs successfully', () => {
      // Well-known valid test CPFs
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('rejects invalid, repeated or malformed CPFs', () => {
      expect(isValidCpf('')).toBe(false);
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('00000000000')).toBe(false);
      expect(isValidCpf('12345678900')).toBe(false);
      expect(isValidCpf('123')).toBe(false);
    });

    it('formats CPF with standard mask (000.000.000-00)', () => {
      expect(formatCpf('52998224725')).toBe('529.982.247-25');
      expect(formatCpf('529')).toBe('529');
      expect(formatCpf('529982')).toBe('529.982');
      expect(formatCpf('529982247')).toBe('529.982.247');
      expect(formatCpf('')).toBe('');
    });
  });

  describe('Price Formatter', () => {
    it('formats cents into BRL currency format', () => {
      expect(formatPriceCents(3500)).toContain('35,00');
      expect(formatPriceCents(0)).toContain('0,00');
      expect(formatPriceCents(null)).toContain('0,00');
      expect(formatPriceCents(undefined)).toContain('0,00');
    });
  });

  describe('calculatePixAmounts', () => {
    const mockSession = {
      $id: 'session-1',
      $createdAt: '2026-11-03T10:00:00.000Z',
      $updatedAt: '2026-11-03T10:00:00.000Z',
      $permissions: [],
      $databaseId: 'main',
      $collectionId: 'table_sessions',
      establishmentId: 'est-1',
      tableId: 'table-1',
      tableNumber: 5,
      status: 'open' as const,
      openedAt: '2026-11-03T10:00:00.000Z',
      participants: JSON.stringify([
        { id: 'part-carlos', name: 'Carlos', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 0 },
        { id: 'part-ana', name: 'Ana', joinedAt: '2026-11-03T10:05:00Z', isPaid: false, paidAmount: 0 },
      ]),
      totalAmount: 10000, // R$ 100,00
      paidAmount: 2000,   // R$ 20,00 já pago
    } as unknown as TableSessionDocument;

    const mockOrders = [
      {
        $id: 'order-1',
        $createdAt: '2026-11-03T10:01:00.000Z',
        $updatedAt: '2026-11-03T10:01:00.000Z',
        $permissions: [],
        $databaseId: 'main',
        $collectionId: 'orders',
        establishmentId: 'est-1',
        tableId: 'table-1',
        tableNumber: 5,
        sessionId: 'session-1',
        participantId: 'part-carlos',
        participantName: 'Carlos',
        productId: 'prod-1',
        productName: 'Hambúrguer Artesanal',
        unitPrice: 3500,
        quantity: 1,
        totalPrice: 3500,
        status: 'delivered' as const,
        createdAt: '2026-11-03T10:01:00.000Z',
      },
      {
        $id: 'order-2',
        $createdAt: '2026-11-03T10:06:00.000Z',
        $updatedAt: '2026-11-03T10:06:00.000Z',
        $permissions: [],
        $databaseId: 'main',
        $collectionId: 'orders',
        establishmentId: 'est-1',
        tableId: 'table-1',
        tableNumber: 5,
        sessionId: 'session-1',
        participantId: 'part-carlos',
        participantName: 'Carlos',
        productId: 'prod-2',
        productName: 'Refrigerante',
        unitPrice: 1000,
        quantity: 1,
        totalPrice: 1000,
        status: 'cancelled' as const, // Pedido cancelado não deve ser cobrado
        createdAt: '2026-11-03T10:06:00.000Z',
      },
      {
        $id: 'order-3',
        $createdAt: '2026-11-03T10:08:00.000Z',
        $updatedAt: '2026-11-03T10:08:00.000Z',
        $permissions: [],
        $databaseId: 'main',
        $collectionId: 'orders',
        establishmentId: 'est-1',
        tableId: 'table-1',
        tableNumber: 5,
        sessionId: 'session-1',
        participantId: 'part-ana',
        participantName: 'Ana',
        productId: 'prod-3',
        productName: 'Pizza Individual',
        unitPrice: 4500,
        quantity: 1,
        totalPrice: 4500,
        status: 'preparing' as const,
        createdAt: '2026-11-03T10:08:00.000Z',
      },
    ] as unknown as OrderDocument[];

    it('calculates remaining balance and mode amounts accurately', () => {
      const amounts = calculatePixAmounts({
        orders: mockOrders,
        session: mockSession,
        currentParticipantId: 'part-carlos',
      });

      // Saldo restante total da mesa: 10000 - 2000 = 8000 (R$ 80,00)
      expect(amounts.remainingTableBalance).toBe(8000);
      expect(amounts.totalCents).toBe(8000);

      // Meus Itens: Carlos pediu 3500 + 1000(cancelado) = 3500
      expect(amounts.myItemsCents).toBe(3500);

      // Dividir igualmente: 8000 / 2 participantes pendentes = 4000
      expect(amounts.unpaidCount).toBe(2);
      expect(amounts.splitCents).toBe(4000);
    });

    it('accounts for participant prior payments and caps at remaining table balance', () => {
      const sessionWithPartialPay = {
        ...mockSession,
        participants: JSON.stringify([
          { id: 'part-carlos', name: 'Carlos', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 1500 },
          { id: 'part-ana', name: 'Ana', joinedAt: '2026-11-03T10:05:00Z', isPaid: true, paidAmount: 4500 },
        ]),
        paidAmount: 6000,
      } as unknown as TableSessionDocument;

      const amounts = calculatePixAmounts({
        orders: mockOrders,
        session: sessionWithPartialPay,
        currentParticipantId: 'part-carlos',
      });

      // Total restante da mesa: 10000 - 6000 = 4000
      expect(amounts.remainingTableBalance).toBe(4000);
      expect(amounts.totalCents).toBe(4000);

      // Carlos consumiu 3500, já pagou 1500 => restam 2000
      expect(amounts.myItemsCents).toBe(2000);

      // Apenas Carlos está pendente agora (Ana isPaid = true)
      expect(amounts.unpaidCount).toBe(1);
      expect(amounts.splitCents).toBe(4000);
    });

    it('rounds split amount up (ceil) to prevent fractional cent underpayments', () => {
      const sessionWithThreeUnpaid = {
        ...mockSession,
        participants: JSON.stringify([
          { id: 'part-1', name: 'P1', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 0 },
          { id: 'part-2', name: 'P2', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 0 },
          { id: 'part-3', name: 'P3', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 0 },
        ]),
        totalAmount: 10000,
        paidAmount: 0,
      } as unknown as TableSessionDocument;

      const amounts = calculatePixAmounts({
        orders: [],
        session: sessionWithThreeUnpaid,
        currentParticipantId: 'part-1',
      });

      // 10000 / 3 = 3333.333 => Math.ceil = 3334
      expect(amounts.unpaidCount).toBe(3);
      expect(amounts.splitCents).toBe(3334);
    });

    it('handles zero or negative balance gracefully', () => {
      const settledSession = {
        ...mockSession,
        paidAmount: 10000,
      } as unknown as TableSessionDocument;

      const amounts = calculatePixAmounts({
        orders: mockOrders,
        session: settledSession,
        currentParticipantId: 'part-carlos',
      });

      expect(amounts.remainingTableBalance).toBe(0);
      expect(amounts.totalCents).toBe(0);
      expect(amounts.myItemsCents).toBe(0);
      expect(amounts.splitCents).toBe(0);
    });

    it('handles null session or empty orders list cleanly', () => {
      const amounts = calculatePixAmounts({
        orders: [],
        session: null,
        currentParticipantId: 'part-carlos',
      });

      expect(amounts.remainingTableBalance).toBe(0);
      expect(amounts.totalCents).toBe(0);
      expect(amounts.myItemsCents).toBe(0);
      expect(amounts.splitCents).toBe(0);
      expect(amounts.unpaidCount).toBe(1);
    });
  });

  describe('formatPixCountdown', () => {
    it('formats 15 minutes (900 seconds) as 15:00', () => {
      expect(formatPixCountdown(900)).toBe('15:00');
    });

    it('formats partial minutes and seconds with padding', () => {
      expect(formatPixCountdown(65)).toBe('01:05');
      expect(formatPixCountdown(9)).toBe('00:09');
      expect(formatPixCountdown(599)).toBe('09:59');
    });

    it('handles 0 and negative seconds safely as 00:00', () => {
      expect(formatPixCountdown(0)).toBe('00:00');
      expect(formatPixCountdown(-5)).toBe('00:00');
    });
  });

  describe('PIX_MODE_DETAILS metadata', () => {
    it('contains descriptions for all three payment modes', () => {
      expect(PIX_MODE_DETAILS.my_items.label).toBe('Pagar Meus Itens');
      expect(PIX_MODE_DETAILS.split.label).toBe('Dividir Igualmente');
      expect(PIX_MODE_DETAILS.total.label).toBe('Pagar Conta Total');
    });
  });
});
