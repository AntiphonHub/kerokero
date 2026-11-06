import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  syncTablesAction,
  resolveServiceCallAction,
  resetTableAction,
  getTableDetailsAction,
  settleAndCloseTableAction,
} from '@/actions/tables';

// Mocks
const mockGetLoggedInUser = vi.fn();
const mockGetEstablishmentByUserId = vi.fn();
const mockEnsureEstablishmentTables = vi.fn();
const mockResolveServiceCall = vi.fn();
const mockResetTableSession = vi.fn();
const mockGetTableById = vi.fn();
const mockListTableServiceCalls = vi.fn();
const mockCloseAndSettleEntireTableSession = vi.fn();

vi.mock('@/lib/appwrite/session', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentByUserId: () => mockGetEstablishmentByUserId(),
}));

vi.mock('@/lib/appwrite/tables', () => ({
  ensureEstablishmentTables: (...args: any[]) => mockEnsureEstablishmentTables(...args),
  resolveServiceCall: (...args: any[]) => mockResolveServiceCall(...args),
  resetTableSession: (...args: any[]) => mockResetTableSession(...args),
  getTableById: (...args: any[]) => mockGetTableById(...args),
  listTableServiceCalls: (...args: any[]) => mockListTableServiceCalls(...args),
}));

vi.mock('@/lib/appwrite/client-sessions', () => ({
  closeAndSettleEntireTableSession: (...args: any[]) =>
    mockCloseAndSettleEntireTableSession(...args),
}));

describe('Tables Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncTablesAction', () => {
    it('returns error if user is not authenticated', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(null);
      const res = await syncTablesAction();
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/sessão expirada/i);
    });

    it('syncs tables for the authenticated user establishment', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce({ $id: 'u1' });
      mockGetEstablishmentByUserId.mockResolvedValueOnce({
        $id: 'est_1',
        tablesCount: 5,
      });
      mockEnsureEstablishmentTables.mockResolvedValueOnce([
        { $id: 't1', number: 1 },
        { $id: 't2', number: 2 },
      ]);

      const res = await syncTablesAction();
      expect(res.success).toBe(true);
      expect(mockEnsureEstablishmentTables).toHaveBeenCalledWith('est_1', 5);
    });
  });

  describe('resolveServiceCallAction', () => {
    it('resolves the specified service call', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce({ $id: 'u1' });
      mockGetEstablishmentByUserId.mockResolvedValueOnce({ $id: 'est_1' });
      mockResolveServiceCall.mockResolvedValueOnce(undefined);

      const res = await resolveServiceCallAction('sc_1', 't1', 'occupied');
      expect(res.success).toBe(true);
      expect(mockResolveServiceCall).toHaveBeenCalledWith('sc_1', 't1', 'occupied');
    });
  });

  describe('resetTableAction', () => {
    it('resets a table session back to idle', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce({ $id: 'u1' });
      mockGetEstablishmentByUserId.mockResolvedValueOnce({ $id: 'est_1' });
      mockResetTableSession.mockResolvedValueOnce({ $id: 't1', status: 'idle' });

      const res = await resetTableAction('t1');
      expect(res.success).toBe(true);
      expect(mockResetTableSession).toHaveBeenCalledWith('t1');
    });
  });

  describe('getTableDetailsAction', () => {
    it('fetches table and its active service calls', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce({ $id: 'u1' });
      mockGetEstablishmentByUserId.mockResolvedValueOnce({ $id: 'est_1' });
      mockGetTableById.mockResolvedValueOnce({ $id: 't1', number: 1, establishmentId: 'est_1' });
      mockListTableServiceCalls.mockResolvedValueOnce([
        { $id: 'sc1', type: 'waiter', status: 'pending' },
      ]);

      const res = await getTableDetailsAction('t1');
      expect(res.success).toBe(true);
      expect(res.table?.number).toBe(1);
      expect(res.serviceCalls?.length).toBe(1);
    });
  });

  describe('settleAndCloseTableAction', () => {
    it('returns error if user is unauthenticated', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(null);
      const res = await settleAndCloseTableAction('t1');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/sessão expirada/i);
    });

    it('settles table, marks all participants paid and resets table to idle', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce({ $id: 'u1' });
      mockGetEstablishmentByUserId.mockResolvedValueOnce({ $id: 'est_1' });
      mockGetTableById.mockResolvedValueOnce({ $id: 't1', establishmentId: 'est_1' });
      mockCloseAndSettleEntireTableSession.mockResolvedValueOnce({
        table: { $id: 't1', status: 'idle', currentTotal: 0 },
        session: { $id: 'sess_1', status: 'closed' },
      });

      const res = await settleAndCloseTableAction('t1');
      expect(res.success).toBe(true);
      expect(mockCloseAndSettleEntireTableSession).toHaveBeenCalledWith('t1', 'pos_card');
      expect(res.data?.table.status).toBe('idle');
    });
  });
});
