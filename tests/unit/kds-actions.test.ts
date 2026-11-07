import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockGetLoggedInUser = vi.fn();
const mockGetEstablishmentByUserId = vi.fn();
const mockListKitchenOrders = vi.fn();
const mockGetOrderById = vi.fn();
const mockUpdateOrderStatus = vi.fn();
const mockBatchUpdateOrdersStatus = vi.fn();

vi.mock('@/lib/appwrite/session', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentByUserId: () => mockGetEstablishmentByUserId(),
}));

vi.mock('@/lib/appwrite/orders', () => ({
  listKitchenOrders: (...args: any[]) => mockListKitchenOrders(...args),
  getOrderById: (...args: any[]) => mockGetOrderById(...args),
  updateOrderStatus: (...args: any[]) => mockUpdateOrderStatus(...args),
  batchUpdateOrdersStatus: (...args: any[]) => mockBatchUpdateOrdersStatus(...args),
}));

import {
  getKitchenOrdersAction,
  updateOrderStatusAction,
  batchUpdateOrdersStatusAction,
} from '@/actions/kds';

describe('KDS Actions', () => {
  const mockUser = { $id: 'user_123', email: 'chef@bempedi.com' };
  const mockEstablishment = {
    $id: 'est_123',
    userId: 'user_123',
    name: 'Burger & Co',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockGetEstablishmentByUserId.mockResolvedValue(mockEstablishment);
  });

  describe('getKitchenOrdersAction', () => {
    it('returns error if user is not authenticated', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      const res = await getKitchenOrdersAction();
      expect(res.success).toBe(false);
      expect(res.message).toContain('Sessão');
    });

    it('returns orders for the user establishment', async () => {
      const mockOrders = [
        {
          $id: 'ord-1',
          establishmentId: 'est_123',
          productName: 'Burger',
          status: 'pending',
        },
      ];
      mockListKitchenOrders.mockResolvedValue(mockOrders);

      const res = await getKitchenOrdersAction();
      expect(res.success).toBe(true);
      expect(res.orders).toEqual(mockOrders);
      expect(mockListKitchenOrders).toHaveBeenCalledWith('est_123');
    });
  });

  describe('updateOrderStatusAction', () => {
    it('rejects invalid status', async () => {
      const res = await updateOrderStatusAction('ord-1', 'invalid_status' as any);
      expect(res.success).toBe(false);
      expect(res.message).toBeDefined();
    });

    it('updates order status if order belongs to establishment', async () => {
      const existingOrder = {
        $id: 'ord-1',
        establishmentId: 'est_123',
        status: 'pending',
      };
      mockGetOrderById.mockResolvedValue(existingOrder);
      mockUpdateOrderStatus.mockResolvedValue({
        ...existingOrder,
        status: 'preparing',
      });

      const res = await updateOrderStatusAction('ord-1', 'preparing');
      expect(res.success).toBe(true);
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-1', 'preparing');
    });

    it('prevents updating order from another establishment', async () => {
      const foreignOrder = {
        $id: 'ord-99',
        establishmentId: 'est_other',
        status: 'pending',
      };
      mockGetOrderById.mockResolvedValue(foreignOrder);

      const res = await updateOrderStatusAction('ord-99', 'preparing');
      expect(res.success).toBe(false);
      expect(res.message).toContain('não encontrado');
      expect(mockUpdateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('batchUpdateOrdersStatusAction', () => {
    it('updates multiple orders of the establishment to target status', async () => {
      mockBatchUpdateOrdersStatus.mockResolvedValue(2);

      const res = await batchUpdateOrdersStatusAction(['ord-1', 'ord-2'], 'ready');
      expect(res.success).toBe(true);
      expect(res.updatedCount).toBe(2);
      expect(mockBatchUpdateOrdersStatus).toHaveBeenCalledWith(
        'est_123',
        ['ord-1', 'ord-2'],
        'ready'
      );
    });

    it('handles empty order list gracefully', async () => {
      const res = await batchUpdateOrdersStatusAction([], 'ready');
      expect(res.success).toBe(false);
      expect(res.message).toContain('Nenhum pedido');
    });
  });
});
