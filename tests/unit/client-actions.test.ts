import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateClientLocation,
  joinTable,
  submitOrderAction,
  callWaiterAction,
  requestPixCheckoutAction,
  pollPixStatusAction,
  ActionResult,
} from '@/actions/client';
import {
  PARTICIPANT_COOKIE_NAME,
  generateParticipantToken,
} from '@/lib/security/client-session';
import { generateTableToken } from '@/lib/security/table-token';
import * as tablesDb from '@/lib/appwrite/tables';
import * as clientSessionsDb from '@/lib/appwrite/client-sessions';
import * as ordersDb from '@/lib/appwrite/orders';
import * as asaasPix from '@/lib/asaas/pix';
import * as appwriteServer from '@/lib/appwrite/server';

// Mock cookies store for next/headers
const mockCookieMap = new Map<string, string>();
const mockCookieSet = vi.fn((name: string, value: string, options?: any) => {
  mockCookieMap.set(name, value);
});
const mockCookieDelete = vi.fn((name: string) => {
  mockCookieMap.delete(name);
});
const mockCookieGet = vi.fn((name: string) => {
  const val = mockCookieMap.get(name);
  return val !== undefined ? { name, value: val } : undefined;
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookieGet,
    set: mockCookieSet,
    delete: mockCookieDelete,
  })),
}));

// Mock Appwrite tables
vi.mock('@/lib/appwrite/tables', () => ({
  getTableByToken: vi.fn(),
  getTableById: vi.fn(),
  createServiceCall: vi.fn(),
}));

// Mock Appwrite client-sessions
vi.mock('@/lib/appwrite/client-sessions', () => ({
  joinTableSession: vi.fn(),
  settleParticipantPayment: vi.fn(),
  getTableSession: vi.fn(),
  parseSessionParticipants: vi.fn((raw: any) => {
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }),
}));

// Mock Appwrite orders
vi.mock('@/lib/appwrite/orders', () => ({
  createOrder: vi.fn(),
  listParticipantOrders: vi.fn(async () => []),
  listSessionOrders: vi.fn(async () => []),
}));

// Mock Appwrite server & SDK
const mockGetDocument = vi.fn();
vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: vi.fn(() => ({
    databases: {
      getDocument: mockGetDocument,
    },
  })),
}));

// Mock Asaas PIX
vi.mock('@/lib/asaas/pix', () => ({
  createPixPaymentOnSubaccount: vi.fn(),
  checkSubaccountPaymentStatus: vi.fn(),
}));

describe('Client Server Actions', () => {
  const validToken = generateTableToken();
  const mockTable = {
    $id: 'table_123',
    establishmentId: 'est_456',
    number: 7,
    label: 'Mesa 07',
    token: validToken,
    status: 'idle',
    isActive: true,
    currentTotal: 0,
  };

  const mockEstablishment = {
    $id: 'est_456',
    name: 'Restaurante Sabor Brasil',
    latitude: -23.561414,
    longitude: -46.655881,
    asaasSubaccountApiKey: 'subaccount_api_key_mock_123',
  };

  const clientNearCoords = {
    latitude: -23.5615,
    longitude: -46.6557,
  };

  const clientFarCoords = {
    latitude: -23.55052,
    longitude: -46.655881,
  };

  beforeEach(() => {
    mockCookieMap.clear();
    vi.clearAllMocks();

    vi.mocked(tablesDb.getTableByToken).mockResolvedValue(mockTable as any);
    vi.mocked(tablesDb.getTableById).mockResolvedValue(mockTable as any);
    mockGetDocument.mockResolvedValue(mockEstablishment as any);
  });

  describe('validateClientLocation', () => {
    it('rejects invalid or non-hex table token', async () => {
      const res = await validateClientLocation('invalid_token', clientNearCoords);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/inválido/i);
    });

    it('rejects if table is not found or inactive', async () => {
      vi.mocked(tablesDb.getTableByToken).mockResolvedValueOnce(null);
      const res = await validateClientLocation(validToken, clientNearCoords);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/não encontrada/i);
    });

    it('rejects if client is outside 250m radius', async () => {
      const res = await validateClientLocation(validToken, clientFarCoords);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/250m|estabelecimento/i);
    });

    it('rejects if client coords are missing and establishment has coords', async () => {
      const res = await validateClientLocation(validToken, null);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/localização|250m/i);
    });

    it('approves when client is within indoor radius (<= 250m)', async () => {
      const res = await validateClientLocation(validToken, clientNearCoords);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(
        expect.objectContaining({
          tableId: 'table_123',
          tableNumber: 7,
          establishmentId: 'est_456',
        }),
      );
    });

    it('allows bypass in development when establishment has no coords', async () => {
      const prevEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      mockGetDocument.mockResolvedValueOnce({
        ...mockEstablishment,
        latitude: undefined,
        longitude: undefined,
      });

      const res = await validateClientLocation(validToken, null);
      expect(res.success).toBe(true);
      (process.env as any).NODE_ENV = prevEnv;
    });
  });

  describe('joinTable', () => {
    it('validates nickname length', async () => {
      const resEmpty = await joinTable(validToken, '', clientNearCoords);
      expect(resEmpty.success).toBe(false);
      expect(resEmpty.message).toMatch(/apelido/i);

      const resShort = await joinTable(validToken, 'A', clientNearCoords);
      expect(resShort.success).toBe(false);
      expect(resShort.message).toMatch(/apelido/i);
    });

    it('blocks entry if client is outside indoor geofence', async () => {
      const res = await joinTable(validToken, 'Carlos', clientFarCoords);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/estabelecimento|250m/i);
    });

    it('registers participant, sets httpOnly cookie and returns session info', async () => {
      const mockSession = {
        $id: 'session_789',
        establishmentId: 'est_456',
        tableId: 'table_123',
        tableNumber: 7,
        status: 'open' as const,
        participants: JSON.stringify([
          {
            id: 'part_111',
            name: 'Carlos',
            joinedAt: new Date().toISOString(),
            isPaid: false,
            paidAmount: 0,
          },
        ]),
        totalAmount: 0,
        paidAmount: 0,
        openedAt: new Date().toISOString(),
      };

      vi.mocked(clientSessionsDb.joinTableSession).mockResolvedValueOnce({
        session: mockSession as any,
        participantId: 'part_111',
        participantName: 'Carlos',
      });

      const res = await joinTable(validToken, 'Carlos', clientNearCoords);

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.participantId).toBe('part_111');
      expect(res.data?.participantName).toBe('Carlos');

      // Verify cookie was set
      expect(mockCookieSet).toHaveBeenCalledWith(
        PARTICIPANT_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
    });
  });

  describe('submitOrderAction', () => {
    it('rejects when participant cookie is missing or invalid', async () => {
      const res = await submitOrderAction([
        {
          productId: 'prod_1',
          productName: 'Hambúrguer',
          unitPrice: 2500,
          quantity: 1,
        },
      ]);

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/sessão/i);
    });

    it('rejects empty items array or invalid item data', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      const resEmpty = await submitOrderAction([]);
      expect(resEmpty.success).toBe(false);

      const resInvalid = await submitOrderAction([
        {
          productId: '',
          productName: 'Coxinha',
          unitPrice: -10,
          quantity: 0,
        },
      ]);
      expect(resInvalid.success).toBe(false);
    });

    it('creates orders and links to participant and active session', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      const mockOrderCreated = {
        $id: 'ord_1',
        establishmentId: 'est_456',
        tableId: 'table_123',
        tableNumber: 7,
        sessionId: 'session_789',
        participantId: 'part_111',
        participantName: 'Carlos',
        productId: 'prod_burger',
        productName: 'X-Salada Especial',
        unitPrice: 2800,
        quantity: 2,
        totalPrice: 5600,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(ordersDb.createOrder).mockResolvedValueOnce(mockOrderCreated as any);

      const res = await submitOrderAction([
        {
          productId: 'prod_burger',
          productName: 'X-Salada Especial',
          unitPrice: 2800,
          quantity: 2,
          notes: 'Sem maionese',
        },
      ]);

      expect(res.success).toBe(true);
      expect(ordersDb.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          participantId: 'part_111',
          participantName: 'Carlos',
          sessionId: 'session_789',
          tableId: 'table_123',
          tableNumber: 7,
          unitPrice: 2800,
          quantity: 2,
          notes: 'Sem maionese',
        }),
      );
    });
  });

  describe('callWaiterAction', () => {
    it('rejects without session cookie', async () => {
      const res = await callWaiterAction('Trazer guardanapo');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/sessão/i);
    });

    it('creates service call for waiter request', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      vi.mocked(tablesDb.createServiceCall).mockResolvedValueOnce({
        $id: 'call_1',
        type: 'waiter',
      } as any);

      const res = await callWaiterAction('Trazer mais gelo');

      expect(res.success).toBe(true);
      expect(tablesDb.createServiceCall).toHaveBeenCalledWith(
        expect.objectContaining({
          establishmentId: 'est_456',
          tableId: 'table_123',
          tableNumber: 7,
          type: 'waiter',
          description: 'Trazer mais gelo',
          requestedBy: 'Carlos',
        }),
      );
    });

    it('creates service call for bill card machine request', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      vi.mocked(tablesDb.createServiceCall).mockResolvedValueOnce({
        $id: 'call_2',
        type: 'bill_card',
      } as any);

      const res = await callWaiterAction('Maquininha de cartão - Débito', 'bill_card');

      expect(res.success).toBe(true);
      expect(tablesDb.createServiceCall).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bill_card',
          requestedBy: 'Carlos',
        }),
      );
    });
  });

  describe('requestPixCheckoutAction', () => {
    const validCpf = '52998224725'; // CPF válido matemático

    it('rejects invalid CPF', async () => {
      const res = await requestPixCheckoutAction('my_items', '111.111.111-11');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/CPF/i);
    });

    it('rejects when participant cookie is missing', async () => {
      const res = await requestPixCheckoutAction('my_items', validCpf);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/sessão/i);
    });

    it('rejects when establishment has not configured asaas subaccount key', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      mockGetDocument.mockResolvedValueOnce({
        ...mockEstablishment,
        asaasSubaccountApiKey: '',
      });

      const res = await requestPixCheckoutAction('my_items', validCpf);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/subconta|PIX|configurou/i);
    });

    it('emits PIX for mode "my_items"', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      // Session doc
      vi.mocked(clientSessionsDb.getTableSession).mockResolvedValueOnce({
        $id: 'session_789',
        establishmentId: 'est_456',
        tableId: 'table_123',
        tableNumber: 7,
        status: 'open',
        totalAmount: 10000,
        paidAmount: 2000,
        participants: JSON.stringify([
          { id: 'part_111', name: 'Carlos', isPaid: false, paidAmount: 0 },
          { id: 'part_222', name: 'Ana', isPaid: false, paidAmount: 0 },
        ]),
      } as any);

      // Participant orders: 2 orders of R$ 25,00 = R$ 50,00 (5000 cents)
      vi.mocked(ordersDb.listParticipantOrders).mockResolvedValueOnce([
        {
          $id: 'ord_1',
          unitPrice: 2500,
          quantity: 1,
          totalPrice: 2500,
          status: 'delivered',
        } as any,
        {
          $id: 'ord_2',
          unitPrice: 2500,
          quantity: 1,
          totalPrice: 2500,
          status: 'delivered',
        } as any,
      ]);

      vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
        paymentId: 'pay_sub_123',
        pixQrCodeBase64: 'base64_qr_code',
        pixCopyPaste: '00020126...',
        expirationDate: '2026-11-03 14:00:00',
      });

      const res = await requestPixCheckoutAction('my_items', validCpf);

      expect(res.success).toBe(true);
      expect(res.data?.paymentId).toBe('pay_sub_123');
      expect(res.data?.amountCents).toBe(5000);
      expect(res.data?.value).toBe(50);

      expect(asaasPix.createPixPaymentOnSubaccount).toHaveBeenCalledWith(
        'subaccount_api_key_mock_123',
        expect.objectContaining({
          customerName: 'Carlos',
          customerCpf: validCpf,
          value: 50,
        }),
      );
    });

    it('emits PIX for mode "split" equally among unpaid participants', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      // Remaining table balance: 10000 - 2000 = 8000 cents (R$ 80,00)
      // 2 unpaid participants -> R$ 40,00 each
      vi.mocked(clientSessionsDb.getTableSession).mockResolvedValueOnce({
        $id: 'session_789',
        establishmentId: 'est_456',
        tableId: 'table_123',
        tableNumber: 7,
        status: 'open',
        totalAmount: 10000,
        paidAmount: 2000,
        participants: JSON.stringify([
          { id: 'part_111', name: 'Carlos', isPaid: false, paidAmount: 0 },
          { id: 'part_222', name: 'Ana', isPaid: false, paidAmount: 0 },
        ]),
      } as any);

      vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
        paymentId: 'pay_sub_split',
        pixQrCodeBase64: 'base64_qr_code',
        pixCopyPaste: '00020126...',
        expirationDate: '2026-11-03 14:00:00',
      });

      const res = await requestPixCheckoutAction('split', validCpf);

      expect(res.success).toBe(true);
      expect(res.data?.amountCents).toBe(4000);
      expect(res.data?.value).toBe(40);
    });

    it('emits PIX for mode "total" covering entire remaining table balance', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      vi.mocked(clientSessionsDb.getTableSession).mockResolvedValueOnce({
        $id: 'session_789',
        establishmentId: 'est_456',
        tableId: 'table_123',
        tableNumber: 7,
        status: 'open',
        totalAmount: 10000,
        paidAmount: 2000,
        participants: JSON.stringify([
          { id: 'part_111', name: 'Carlos', isPaid: false, paidAmount: 0 },
        ]),
      } as any);

      vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
        paymentId: 'pay_sub_total',
        pixQrCodeBase64: 'base64_qr_code',
        pixCopyPaste: '00020126...',
        expirationDate: '2026-11-03 14:00:00',
      });

      const res = await requestPixCheckoutAction('total', validCpf);

      expect(res.success).toBe(true);
      expect(res.data?.amountCents).toBe(8000);
      expect(res.data?.value).toBe(80);
    });
  });

  describe('pollPixStatusAction', () => {
    it('returns isPaid false when payment is still pending', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      vi.mocked(asaasPix.checkSubaccountPaymentStatus).mockResolvedValueOnce({
        status: 'PENDING',
        isPaid: false,
      });

      const res = await pollPixStatusAction('pay_123');

      expect(res.success).toBe(true);
      expect(res.data?.isPaid).toBe(false);
      expect(clientSessionsDb.settleParticipantPayment).not.toHaveBeenCalled();
      expect(mockCookieDelete).not.toHaveBeenCalled();
    });

    it('settles participant payment and revokes cookie when paid', async () => {
      const token = await generateParticipantToken({
        participantId: 'part_111',
        participantName: 'Carlos',
        sessionId: 'session_789',
        tableId: 'table_123',
        establishmentId: 'est_456',
      });
      mockCookieMap.set(PARTICIPANT_COOKIE_NAME, token);

      vi.mocked(asaasPix.checkSubaccountPaymentStatus).mockResolvedValueOnce({
        status: 'RECEIVED',
        isPaid: true,
      });

      vi.mocked(clientSessionsDb.settleParticipantPayment).mockResolvedValueOnce({
        $id: 'session_789',
        status: 'closed',
        participants: JSON.stringify([
          { id: 'part_111', name: 'Carlos', isPaid: true, paidAmount: 5000 },
        ]),
      } as any);

      const res = await pollPixStatusAction('pay_123', 5000);

      expect(res.success).toBe(true);
      expect(res.data?.isPaid).toBe(true);
      expect(clientSessionsDb.settleParticipantPayment).toHaveBeenCalledWith(
        'session_789',
        'part_111',
        5000,
      );
      expect(mockCookieDelete).toHaveBeenCalledWith(PARTICIPANT_COOKIE_NAME);
    });
  });
});
