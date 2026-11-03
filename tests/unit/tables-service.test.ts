import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ensureEstablishmentTables,
  listEstablishmentTables,
  getTableById,
  getTableByToken,
  updateTableStatus,
  createServiceCall,
  resolveServiceCall,
  resetTableSession,
} from '@/lib/appwrite/tables';
import { appwriteConfig } from '@/lib/appwrite/config';

// Mock do node-appwrite
const mockListDocuments = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: {
      listDocuments: mockListDocuments,
      createDocument: mockCreateDocument,
      updateDocument: mockUpdateDocument,
    },
  }),
}));

describe('Tables Appwrite Service', () => {
  const establishmentId = 'est_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureEstablishmentTables', () => {
    it('creates missing tables up to count idempotently', async () => {
      // Cenário: Já existem as mesas 1 e 2, lojista configurou 4 mesas
      mockListDocuments.mockResolvedValueOnce({
        total: 2,
        documents: [
          { $id: 't1', establishmentId, number: 1, label: 'Mesa 01', token: 'token1', status: 'idle' },
          { $id: 't2', establishmentId, number: 2, label: 'Mesa 02', token: 'token2', status: 'idle' },
        ],
      });

      mockCreateDocument
        .mockResolvedValueOnce({ $id: 't3', establishmentId, number: 3, label: 'Mesa 03', token: 'token3', status: 'idle' })
        .mockResolvedValueOnce({ $id: 't4', establishmentId, number: 4, label: 'Mesa 04', token: 'token4', status: 'idle' });

      // Chamada após a criação para listar todas
      mockListDocuments.mockResolvedValueOnce({
        total: 4,
        documents: [
          { $id: 't1', establishmentId, number: 1, label: 'Mesa 01', token: 'token1', status: 'idle' },
          { $id: 't2', establishmentId, number: 2, label: 'Mesa 02', token: 'token2', status: 'idle' },
          { $id: 't3', establishmentId, number: 3, label: 'Mesa 03', token: 'token3', status: 'idle' },
          { $id: 't4', establishmentId, number: 4, label: 'Mesa 04', token: 'token4', status: 'idle' },
        ],
      });

      const tables = await ensureEstablishmentTables(establishmentId, 4);

      // Deve ter criado apenas as mesas 3 e 4
      expect(mockCreateDocument).toHaveBeenCalledTimes(2);
      expect(tables.length).toBe(4);
    });

    it('does not create any tables if all already exist', async () => {
      mockListDocuments.mockResolvedValueOnce({
        total: 2,
        documents: [
          { $id: 't1', establishmentId, number: 1, label: 'Mesa 01', token: 'token1', status: 'idle' },
          { $id: 't2', establishmentId, number: 2, label: 'Mesa 02', token: 'token2', status: 'idle' },
        ],
      });

      const tables = await ensureEstablishmentTables(establishmentId, 2);

      expect(mockCreateDocument).not.toHaveBeenCalled();
      expect(tables.length).toBe(2);
    });
  });

  describe('listEstablishmentTables', () => {
    it('returns all tables of an establishment sorted by number', async () => {
      mockListDocuments.mockResolvedValueOnce({
        total: 2,
        documents: [
          { $id: 't1', establishmentId, number: 1, label: 'Mesa 01' },
          { $id: 't2', establishmentId, number: 2, label: 'Mesa 02' },
        ],
      });

      const result = await listEstablishmentTables(establishmentId);
      expect(result.length).toBe(2);
      expect(mockListDocuments).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        expect.any(Array),
      );
    });
  });

  describe('getTableByToken', () => {
    it('retrieves active table by cryptographic token', async () => {
      mockListDocuments.mockResolvedValueOnce({
        total: 1,
        documents: [{ $id: 't1', establishmentId, number: 1, token: 'secret-token-123' }],
      });

      const table = await getTableByToken('secret-token-123');
      expect(table).not.toBeNull();
      expect(table?.number).toBe(1);
    });

    it('returns null if token not found', async () => {
      mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
      const table = await getTableByToken('non-existent');
      expect(table).toBeNull();
    });
  });

  describe('updateTableStatus', () => {
    it('updates status and active total of a table', async () => {
      mockUpdateDocument.mockResolvedValueOnce({
        $id: 't1',
        establishmentId,
        status: 'waiter_called',
        serviceCallReason: 'Garçom solicitado',
        currentTotal: 4500,
      });

      const updated = await updateTableStatus('t1', {
        status: 'waiter_called',
        serviceCallReason: 'Garçom solicitado',
        currentTotal: 4500,
      });

      expect(updated.status).toBe('waiter_called');
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        't1',
        expect.objectContaining({
          status: 'waiter_called',
          serviceCallReason: 'Garçom solicitado',
          currentTotal: 4500,
        }),
      );
    });
  });

  describe('service calls and reset', () => {
    it('creates a service call and updates table status to waiter_called', async () => {
      mockCreateDocument.mockResolvedValueOnce({
        $id: 'sc_1',
        tableId: 't1',
        type: 'waiter',
        status: 'pending',
      });
      mockUpdateDocument.mockResolvedValueOnce({
        $id: 't1',
        status: 'waiter_called',
      });

      const call = await createServiceCall({
        establishmentId,
        tableId: 't1',
        tableNumber: 1,
        type: 'waiter',
        description: 'Gelo',
        requestedBy: 'Ana',
      });

      expect(call.$id).toBe('sc_1');
      expect(mockCreateDocument).toHaveBeenCalled();
      expect(mockUpdateDocument).toHaveBeenCalled();
    });

    it('resolves a service call and resets table status if no other calls are pending', async () => {
      mockUpdateDocument.mockResolvedValueOnce({
        $id: 'sc_1',
        status: 'completed',
      });
      // Busca outros chamados pendentes
      mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
      // Atualiza a mesa
      mockUpdateDocument.mockResolvedValueOnce({
        $id: 't1',
        status: 'occupied',
        serviceCallReason: null,
      });

      await resolveServiceCall('sc_1', 't1', 'occupied');

      expect(mockUpdateDocument).toHaveBeenCalledTimes(2);
    });

    it('resets a table session back to idle', async () => {
      mockUpdateDocument.mockResolvedValueOnce({
        $id: 't1',
        status: 'idle',
        activeSessionId: null,
        currentTotal: 0,
        serviceCallReason: null,
      });

      const table = await resetTableSession('t1');
      expect(table.status).toBe('idle');
      expect(table.currentTotal).toBe(0);
    });
  });
});
