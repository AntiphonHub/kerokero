import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateOrderUrgency,
  formatElapsedTime,
  parseSelectedOptions,
  groupOrdersByTable,
  aggregateKitchenItems,
  getNextOrderStatus,
  getPreviousOrderStatus,
} from '@/lib/utils/kds';
import { OrderDocument } from '@/lib/appwrite/orders';

describe('KDS Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateOrderUrgency', () => {
    it('returns "normal" for orders placed less than 15 minutes ago', () => {
      const createdAt = new Date('2026-11-04T11:50:00Z').toISOString(); // 10 min
      expect(calculateOrderUrgency(createdAt)).toBe('normal');
    });

    it('returns "warning" for orders placed between 15 and 30 minutes ago', () => {
      const createdAt = new Date('2026-11-04T11:40:00Z').toISOString(); // 20 min
      expect(calculateOrderUrgency(createdAt)).toBe('warning');
    });

    it('returns "critical" for orders placed more than 30 minutes ago', () => {
      const createdAt = new Date('2026-11-04T11:20:00Z').toISOString(); // 40 min
      expect(calculateOrderUrgency(createdAt)).toBe('critical');
    });
  });

  describe('formatElapsedTime', () => {
    it('formats minutes elapsed accurately', () => {
      const justNow = new Date('2026-11-04T11:59:30Z').toISOString();
      expect(formatElapsedTime(justNow)).toBe('agora');

      const fiveMinAgo = new Date('2026-11-04T11:55:00Z').toISOString();
      expect(formatElapsedTime(fiveMinAgo)).toBe('5 min');

      const twoHoursAgo = new Date('2026-11-04T09:30:00Z').toISOString();
      expect(formatElapsedTime(twoHoursAgo)).toBe('2h 30m');
    });
  });

  describe('parseSelectedOptions', () => {
    it('returns empty array when input is undefined or empty', () => {
      expect(parseSelectedOptions(undefined)).toEqual([]);
      expect(parseSelectedOptions('')).toEqual([]);
    });

    it('parses valid JSON string array or record', () => {
      const jsonStr = JSON.stringify(['Sem cebola', 'Ponto: Ao ponto']);
      expect(parseSelectedOptions(jsonStr)).toEqual(['Sem cebola', 'Ponto: Ao ponto']);

      const jsonObject = JSON.stringify({ 'Ponto da carne': 'Ao ponto', 'Molho': 'Barbecue' });
      expect(parseSelectedOptions(jsonObject)).toEqual(['Ponto da carne: Ao ponto', 'Molho: Barbecue']);
    });

    it('returns raw string as single item if not JSON', () => {
      expect(parseSelectedOptions('Sem gelo')).toEqual(['Sem gelo']);
    });
  });

  describe('groupOrdersByTable', () => {
    it('groups orders by tableId and sorts tables by oldest order first', () => {
      const orders = [
        {
          $id: 'ord-1',
          $createdAt: '2026-11-04T11:50:00Z',
          establishmentId: 'est-1',
          tableId: 'tbl-2',
          tableNumber: 2,
          sessionId: 'ses-1',
          participantId: 'p-1',
          participantName: 'Alice',
          productId: 'prod-1',
          productName: 'Hambúrguer',
          unitPrice: 3000,
          quantity: 1,
          totalPrice: 3000,
          status: 'pending',
          createdAt: '2026-11-04T11:50:00Z',
          $collectionId: 'orders',
          $databaseId: 'kerokero',
          $updatedAt: '2026-11-04T11:50:00Z',
          $permissions: [],
        },
        {
          $id: 'ord-2',
          $createdAt: '2026-11-04T11:40:00Z',
          establishmentId: 'est-1',
          tableId: 'tbl-1',
          tableNumber: 1,
          sessionId: 'ses-2',
          participantId: 'p-2',
          participantName: 'Bob',
          productId: 'prod-2',
          productName: 'Pizza',
          unitPrice: 5000,
          quantity: 1,
          totalPrice: 5000,
          status: 'pending',
          createdAt: '2026-11-04T11:40:00Z',
          $collectionId: 'orders',
          $databaseId: 'kerokero',
          $updatedAt: '2026-11-04T11:40:00Z',
          $permissions: [],
        },
        {
          $id: 'ord-3',
          $createdAt: '2026-11-04T11:45:00Z',
          establishmentId: 'est-1',
          tableId: 'tbl-1',
          tableNumber: 1,
          sessionId: 'ses-2',
          participantId: 'p-2',
          participantName: 'Bob',
          productId: 'prod-3',
          productName: 'Batata',
          unitPrice: 2000,
          quantity: 2,
          totalPrice: 4000,
          status: 'pending',
          createdAt: '2026-11-04T11:45:00Z',
          $collectionId: 'orders',
          $databaseId: 'kerokero',
          $updatedAt: '2026-11-04T11:45:00Z',
          $permissions: [],
        },
      ] as unknown as OrderDocument[];

      const grouped = groupOrdersByTable(orders);
      expect(grouped).toHaveLength(2);
      // Table 1 has oldest order (11:40), so it should be first
      expect(grouped[0].tableNumber).toBe(1);
      expect(grouped[0].orders).toHaveLength(2);
      expect(grouped[1].tableNumber).toBe(2);
      expect(grouped[1].orders).toHaveLength(1);
    });
  });

  describe('aggregateKitchenItems', () => {
    it('aggregates item counts across pending and preparing orders', () => {
      const orders = [
        {
          $id: '1',
          productName: 'Smash Burger',
          quantity: 2,
          status: 'pending',
        },
        {
          $id: '2',
          productName: 'Smash Burger',
          quantity: 3,
          status: 'preparing',
        },
        {
          $id: '3',
          productName: 'Batata Frita',
          quantity: 1,
          status: 'pending',
        },
        {
          $id: '4',
          productName: 'Sobremesa',
          quantity: 1,
          status: 'ready', // ready items should be excluded from pending/preparing aggregate
        },
      ] as unknown as OrderDocument[];

      const aggregated = aggregateKitchenItems(orders);
      expect(aggregated).toEqual([
        { productName: 'Smash Burger', quantity: 5 },
        { productName: 'Batata Frita', quantity: 1 },
      ]);
    });
  });

  describe('status flow transitions', () => {
    it('returns the correct next status', () => {
      expect(getNextOrderStatus('pending')).toBe('preparing');
      expect(getNextOrderStatus('preparing')).toBe('ready');
      expect(getNextOrderStatus('ready')).toBe('delivered');
      expect(getNextOrderStatus('delivered')).toBeNull();
      expect(getNextOrderStatus('cancelled')).toBeNull();
    });

    it('returns the correct previous status', () => {
      expect(getPreviousOrderStatus('pending')).toBeNull();
      expect(getPreviousOrderStatus('preparing')).toBe('pending');
      expect(getPreviousOrderStatus('ready')).toBe('preparing');
      expect(getPreviousOrderStatus('delivered')).toBe('ready');
      expect(getPreviousOrderStatus('cancelled')).toBeNull();
    });
  });
});
