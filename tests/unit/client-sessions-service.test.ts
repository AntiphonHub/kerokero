import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  joinTableSession,
  getTableSession,
  getActiveTableSession,
  settleParticipantPayment,
  type TableSessionDocument,
} from '@/lib/appwrite/client-sessions';
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

describe('Client Sessions Appwrite Service', () => {
  const establishmentId = 'est_123';
  const tableId = 'tbl_456';
  const tableNumber = 5;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('joinTableSession', () => {
    it('creates a new session and occupies table when no active session exists', async () => {
      // Table exists with no active session
      mockGetDocument.mockImplementation(async (dbId, collId, docId) => {
        if (collId === appwriteConfig.collections.tables && docId === tableId) {
          return {
            $id: tableId,
            establishmentId,
            number: tableNumber,
            status: 'idle',
            activeSessionId: null,
            currentTotal: 0,
          };
        }
        throw new Error('Not found');
      });

      // Query for open session returns empty
      mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] });

      // Create new session
      const createdSessionId = 'sess_new_1';
      mockCreateDocument.mockImplementation(async (dbId, collId, id, data) => {
        return {
          $id: createdSessionId,
          ...data,
          $createdAt: '2026-11-03T10:00:00.000Z',
          $updatedAt: '2026-11-03T10:00:00.000Z',
        };
      });

      // Update table with active session
      mockUpdateDocument.mockResolvedValueOnce({
        $id: tableId,
        status: 'occupied',
        activeSessionId: createdSessionId,
      });

      const result = await joinTableSession(establishmentId, tableId, tableNumber, 'Carlos');

      expect(result.participantName).toBe('Carlos');
      expect(result.participantId).toBeTruthy();
      expect(result.session.$id).toBe(createdSessionId);

      // Verify session created
      expect(mockCreateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tableSessions,
        expect.any(String),
        expect.objectContaining({
          establishmentId,
          tableId,
          tableNumber,
          status: 'open',
          totalAmount: 0,
          paidAmount: 0,
        }),
      );

      // Verify table updated to occupied
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        tableId,
        expect.objectContaining({
          status: 'occupied',
          activeSessionId: createdSessionId,
        }),
      );
    });

    it('joins existing open session from table.activeSessionId', async () => {
      const existingSessionId = 'sess_existing_1';
      const existingParticipants = [
        {
          id: 'p_1',
          name: 'Ana',
          joinedAt: '2026-11-03T09:00:00.000Z',
          isPaid: false,
          paidAmount: 0,
        },
      ];

      mockGetDocument.mockImplementation(async (dbId, collId, docId) => {
        if (collId === appwriteConfig.collections.tables && docId === tableId) {
          return {
            $id: tableId,
            establishmentId,
            number: tableNumber,
            status: 'occupied',
            activeSessionId: existingSessionId,
            currentTotal: 1500,
          };
        }
        if (collId === appwriteConfig.collections.tableSessions && docId === existingSessionId) {
          return {
            $id: existingSessionId,
            establishmentId,
            tableId,
            tableNumber,
            status: 'open',
            participants: JSON.stringify(existingParticipants),
            totalAmount: 1500,
            paidAmount: 0,
          };
        }
        throw new Error('Not found');
      });

      mockUpdateDocument.mockImplementation(async (dbId, collId, docId, data) => {
        return {
          $id: docId,
          establishmentId,
          tableId,
          tableNumber,
          status: 'open',
          totalAmount: 1500,
          paidAmount: 0,
          ...data,
        };
      });

      const result = await joinTableSession(establishmentId, tableId, tableNumber, 'Bruno');

      expect(result.participantName).toBe('Bruno');
      expect(result.session.$id).toBe(existingSessionId);

      // Verify update called with both participants
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tableSessions,
        existingSessionId,
        expect.objectContaining({
          participants: expect.stringContaining('"Bruno"'),
        }),
      );
    });

    it('deduplicates nicknames when name already exists in participants ("Carlos" -> "Carlos (2)")', async () => {
      const existingSessionId = 'sess_dup_1';
      const existingParticipants = [
        {
          id: 'p_1',
          name: 'Carlos',
          joinedAt: '2026-11-03T09:00:00.000Z',
          isPaid: false,
          paidAmount: 0,
        },
      ];

      mockGetDocument.mockImplementation(async (dbId, collId, docId) => {
        if (collId === appwriteConfig.collections.tables) {
          return {
            $id: tableId,
            establishmentId,
            number: tableNumber,
            status: 'occupied',
            activeSessionId: existingSessionId,
          };
        }
        if (collId === appwriteConfig.collections.tableSessions) {
          return {
            $id: existingSessionId,
            establishmentId,
            tableId,
            tableNumber,
            status: 'open',
            participants: JSON.stringify(existingParticipants),
            totalAmount: 0,
            paidAmount: 0,
          };
        }
        throw new Error('Not found');
      });

      mockUpdateDocument.mockImplementation(async (dbId, collId, docId, data) => ({
        $id: docId,
        ...data,
      }));

      const result = await joinTableSession(establishmentId, tableId, tableNumber, 'Carlos');

      expect(result.participantName).toBe('Carlos (2)');
    });

    it('deduplicates sequential nicknames ("Carlos (2)" -> "Carlos (3)")', async () => {
      const existingSessionId = 'sess_dup_2';
      const existingParticipants = [
        { id: 'p_1', name: 'Carlos', joinedAt: '2026-11-03T09:00:00.000Z', isPaid: false, paidAmount: 0 },
        { id: 'p_2', name: 'Carlos (2)', joinedAt: '2026-11-03T09:10:00.000Z', isPaid: false, paidAmount: 0 },
      ];

      mockGetDocument.mockImplementation(async (dbId, collId, docId) => {
        if (collId === appwriteConfig.collections.tables) {
          return { $id: tableId, establishmentId, number: tableNumber, status: 'occupied', activeSessionId: existingSessionId };
        }
        if (collId === appwriteConfig.collections.tableSessions) {
          return {
            $id: existingSessionId,
            establishmentId,
            tableId,
            tableNumber,
            status: 'open',
            participants: JSON.stringify(existingParticipants),
            totalAmount: 0,
            paidAmount: 0,
          };
        }
        throw new Error('Not found');
      });

      mockUpdateDocument.mockImplementation(async (dbId, collId, docId, data) => ({
        $id: docId,
        ...data,
      }));

      const result = await joinTableSession(establishmentId, tableId, tableNumber, 'Carlos');

      expect(result.participantName).toBe('Carlos (3)');
    });
  });

  describe('settleParticipantPayment', () => {
    it('marks participant as paid and increments paidAmount', async () => {
      const sessionId = 'sess_pay_1';
      const participantId = 'part_1';
      const currentParticipants = [
        { id: participantId, name: 'Alice', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 0 },
        { id: 'part_2', name: 'Bob', joinedAt: '2026-11-03T10:05:00Z', isPaid: false, paidAmount: 0 },
      ];

      mockGetDocument.mockResolvedValueOnce({
        $id: sessionId,
        tableId,
        status: 'open',
        participants: JSON.stringify(currentParticipants),
        totalAmount: 5000,
        paidAmount: 0,
      });

      mockUpdateDocument.mockImplementation(async (dbId, collId, docId, data) => ({
        $id: docId,
        tableId,
        ...data,
      }));

      const updated = await settleParticipantPayment(sessionId, participantId, 2500);

      expect(updated.paidAmount).toBe(2500);
      expect(updated.status).toBe('open');

      const parsedParticipants = JSON.parse(updated.participants);
      const paidAlice = parsedParticipants.find((p: any) => p.id === participantId);
      expect(paidAlice.isPaid).toBe(true);
      expect(paidAlice.paidAmount).toBe(2500);
    });

    it('closes session and resets table to idle when full total is paid', async () => {
      const sessionId = 'sess_pay_full';
      const participantId = 'part_full';
      const currentParticipants = [
        { id: participantId, name: 'Alice', joinedAt: '2026-11-03T10:00:00Z', isPaid: false, paidAmount: 0 },
      ];

      mockGetDocument.mockResolvedValueOnce({
        $id: sessionId,
        tableId,
        status: 'open',
        participants: JSON.stringify(currentParticipants),
        totalAmount: 3000,
        paidAmount: 0,
      });

      // Update session document
      mockUpdateDocument
        .mockResolvedValueOnce({
          $id: sessionId,
          tableId,
          status: 'closed',
          participants: JSON.stringify([{ ...currentParticipants[0], isPaid: true, paidAmount: 3000 }]),
          totalAmount: 3000,
          paidAmount: 3000,
        })
        // Reset table document
        .mockResolvedValueOnce({
          $id: tableId,
          status: 'idle',
          activeSessionId: null,
          currentTotal: 0,
        });

      const updated = await settleParticipantPayment(sessionId, participantId, 3000);

      expect(updated.status).toBe('closed');
      expect(updated.paidAmount).toBe(3000);

      // Verify table was reset
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        tableId,
        expect.objectContaining({
          status: 'idle',
          activeSessionId: null,
          currentTotal: 0,
        }),
      );
    });
  });

  describe('getTableSession & getActiveTableSession', () => {
    it('returns session by id', async () => {
      mockGetDocument.mockResolvedValueOnce({
        $id: 'sess_123',
        status: 'open',
        totalAmount: 1000,
      });

      const session = await getTableSession('sess_123');
      expect(session).not.toBeNull();
      expect(session?.$id).toBe('sess_123');
    });

    it('returns null if session not found', async () => {
      mockGetDocument.mockRejectedValueOnce(new Error('Not found'));
      const session = await getTableSession('sess_not_found');
      expect(session).toBeNull();
    });

    it('retrieves active table session from listDocuments', async () => {
      mockListDocuments.mockResolvedValueOnce({
        total: 1,
        documents: [{ $id: 'sess_open_1', tableId, status: 'open' }],
      });

      const active = await getActiveTableSession(tableId);
      expect(active).not.toBeNull();
      expect(active?.$id).toBe('sess_open_1');
    });
  });
});
