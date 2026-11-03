import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrder,
  listSessionOrders,
  listParticipantOrders,
  updateOrderStatus,
  getOrderById,
  type CreateOrderInput,
} from '@/lib/appwrite/orders';
import { appwriteConfig } from '@/lib/appwrite/config';

const mockGetDocument = vi.fn();
const mockListDocuments = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: {
      getDocument: mockGetDocument,
      listDocuments: mockListDocuments,
      createDocument: mockCreateDocument,
      updateDocument: mockUpdateDocument,
    },
  }),
}));

describe('Orders Appwrite Service', () => {
  const establishmentId = 'est_123';
  const tableId = 'tbl_456';
  const tableNumber = 5;
  const sessionId = 'sess_789';
  const participantId = 'part_abc';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    const baseInput: CreateOrderInput = {
      establishmentId,
      tableId,
      tableNumber,
      sessionId,
      participantId,
      participantName: 'Carlos',
      productId: 'prod_burger_1',
      productName: 'Hambúrguer Artesanal',
      unitPrice: 3500, // R$ 35,00
      quantity: 2,
      notes: 'Sem cebola',
      selectedOptions: [{ id: 'opt_bacon', name: 'Bacon extra', price: 500 }],
    };

    it('creates order document and updates session and table totals atomically', async () => {
      const createdOrderDoc = {
        $id: 'ord_123',
        ...baseInput,
        totalPrice: 7000,
        selectedOptions: JSON.stringify(baseInput.selectedOptions),
        status: 'pending',
        createdAt: '2026-11-03T10:30:00.000Z',
      };

      mockCreateDocument.mockResolvedValueOnce(createdOrderDoc);

      // Session document before order
      mockGetDocument.mockImplementation(async (dbId, collId, docId) => {
        if (collId === appwriteConfig.collections.tableSessions && docId === sessionId) {
          return {
            $id: sessionId,
            totalAmount: 2000,
            paidAmount: 0,
          };
        }
        if (collId === appwriteConfig.collections.tables && docId === tableId) {
          return {
            $id: tableId,
            currentTotal: 2000,
            status: 'occupied',
          };
        }
        throw new Error('Not found');
      });

      mockUpdateDocument.mockImplementation(async (dbId, collId, docId, data) => ({
        $id: docId,
        ...data,
      }));

      const order = await createOrder(baseInput);

      expect(order.$id).toBe('ord_123');
      expect(order.totalPrice).toBe(7000);
      expect(order.status).toBe('pending');

      // 1. Verify order document created
      expect(mockCreateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        expect.any(String),
        expect.objectContaining({
          establishmentId,
          tableId,
          sessionId,
          participantId,
          totalPrice: 7000,
          status: 'pending',
        }),
      );

      // 2. Verify table_sessions totalAmount updated from 2000 to 9000
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tableSessions,
        sessionId,
        expect.objectContaining({
          totalAmount: 9000,
        }),
      );

      // 3. Verify tables currentTotal updated to 9000 and status set to order_placed
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        tableId,
        expect.objectContaining({
          currentTotal: 9000,
          status: 'order_placed',
        }),
      );
    });

    it('uses provided totalPrice when passed explicitly', async () => {
      mockCreateDocument.mockImplementation(async (dbId, collId, id, data) => ({
        $id: 'ord_explicit',
        ...data,
      }));

      mockGetDocument.mockResolvedValue({ totalAmount: 0, currentTotal: 0 });
      mockUpdateDocument.mockResolvedValue({});

      const order = await createOrder({
        ...baseInput,
        totalPrice: 8000, // Explicit combo price
      });

      expect(order.totalPrice).toBe(8000);
      expect(mockCreateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        expect.any(String),
        expect.objectContaining({
          totalPrice: 8000,
        }),
      );
    });
  });

  describe('listSessionOrders', () => {
    it('returns all orders for a given session sorted by creation order', async () => {
      const mockOrders = [
        { $id: 'ord_1', sessionId, productName: 'Item 1', $createdAt: '2026-11-03T10:00:00Z' },
        { $id: 'ord_2', sessionId, productName: 'Item 2', $createdAt: '2026-11-03T10:15:00Z' },
      ];

      mockListDocuments.mockResolvedValueOnce({
        total: 2,
        documents: mockOrders,
      });

      const orders = await listSessionOrders(sessionId);

      expect(orders.length).toBe(2);
      expect(orders[0].$id).toBe('ord_1');
      expect(mockListDocuments).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        expect.any(Array),
      );
    });
  });

  describe('listParticipantOrders', () => {
    it('filters orders by session and participant', async () => {
      const mockOrders = [
        { $id: 'ord_1', sessionId, participantId, productName: 'Item 1' },
      ];

      mockListDocuments.mockResolvedValueOnce({
        total: 1,
        documents: mockOrders,
      });

      const orders = await listParticipantOrders(sessionId, participantId);

      expect(orders.length).toBe(1);
      expect(orders[0].participantId).toBe(participantId);
    });
  });

  describe('updateOrderStatus', () => {
    it('updates status of an existing order', async () => {
      mockUpdateDocument.mockResolvedValueOnce({
        $id: 'ord_1',
        status: 'preparing',
      });

      const updated = await updateOrderStatus('ord_1', 'preparing');
      expect(updated.status).toBe('preparing');
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        'ord_1',
        { status: 'preparing' },
      );
    });
  });

  describe('getOrderById', () => {
    it('fetches an order by ID or returns null if not found', async () => {
      mockGetDocument.mockResolvedValueOnce({
        $id: 'ord_1',
        productName: 'Burger',
      });

      const order = await getOrderById('ord_1');
      expect(order?.$id).toBe('ord_1');

      mockGetDocument.mockRejectedValueOnce(new Error('Not found'));
      const notFound = await getOrderById('non_existent');
      expect(notFound).toBeNull();
    });
  });
});
