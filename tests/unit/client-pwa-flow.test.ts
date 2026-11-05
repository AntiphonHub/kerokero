import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  validateClientLocation,
  joinTable,
  submitOrderAction,
  getTableTabDataAction,
  requestPixCheckoutAction,
  pollPixStatusAction,
  clearClientSessionAction,
} from '@/actions/client';
import { PARTICIPANT_COOKIE_NAME } from '@/lib/security/client-session';
import { generateTableToken } from '@/lib/security/table-token';
import { appwriteConfig } from '@/lib/appwrite/config';
import {
  filterParticipantOrders,
  calculateParticipantTotal,
  calculateTableSummary,
} from '@/lib/utils/tab';
import * as asaasPix from '@/lib/asaas/pix';

// --- Multi-client Cookie Store Mock ---
let activeClient: 'carlos' | 'ana' = 'carlos';
const clientCookies: Record<string, Map<string, string>> = {
  carlos: new Map(),
  ana: new Map(),
};

function switchClientContext(client: 'carlos' | 'ana') {
  activeClient = client;
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => {
    const store = clientCookies[activeClient];
    return {
      get: vi.fn((name: string) => {
        const value = store.get(name);
        return value !== undefined ? { name, value } : undefined;
      }),
      set: vi.fn((name: string, value: string) => {
        store.set(name, value);
      }),
      delete: vi.fn((name: string) => {
        store.delete(name);
      }),
    };
  }),
}));

// --- Stateful In-Memory Appwrite Database Mock ---
interface InMemDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: unknown;
}

class InMemoryAppwriteDb {
  private collections = new Map<string, Map<string, InMemDoc>>();

  getCollection(collId: string): Map<string, InMemDoc> {
    if (!this.collections.has(collId)) {
      this.collections.set(collId, new Map());
    }
    return this.collections.get(collId)!;
  }

  seed(collId: string, doc: Record<string, unknown>): InMemDoc {
    const fullDoc: InMemDoc = {
      $id: (doc.$id as string) || `seed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      $createdAt: (doc.$createdAt as string) || new Date().toISOString(),
      $updatedAt: (doc.$updatedAt as string) || new Date().toISOString(),
      ...doc,
    };
    this.getCollection(collId).set(fullDoc.$id, fullDoc);
    return fullDoc;
  }

  getDocument = async (_dbId: string, collId: string, docId: string): Promise<InMemDoc> => {
    const coll = this.getCollection(collId);
    const doc = coll.get(docId);
    if (!doc) {
      throw new Error(`Document ${docId} in collection ${collId} not found`);
    }
    return JSON.parse(JSON.stringify(doc));
  };

  createDocument = async (
    _dbId: string,
    collId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<InMemDoc> => {
    const coll = this.getCollection(collId);
    const docId = id === 'unique()' || !id
      ? `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      : id;
    const now = new Date().toISOString();
    const doc: InMemDoc = {
      $id: docId,
      $createdAt: now,
      $updatedAt: now,
      ...data,
    };
    coll.set(docId, doc);
    return JSON.parse(JSON.stringify(doc));
  };

  updateDocument = async (
    _dbId: string,
    collId: string,
    docId: string,
    data: Record<string, unknown>,
  ): Promise<InMemDoc> => {
    const coll = this.getCollection(collId);
    const existing = coll.get(docId);
    if (!existing) {
      throw new Error(`Document ${docId} in collection ${collId} not found`);
    }
    const updated: InMemDoc = {
      ...existing,
      ...data,
      $updatedAt: new Date().toISOString(),
    };
    coll.set(docId, updated);
    return JSON.parse(JSON.stringify(updated));
  };

  listDocuments = async (
    _dbId: string,
    collId: string,
    queries?: unknown[],
  ): Promise<{ total: number; documents: InMemDoc[] }> => {
    const coll = this.getCollection(collId);
    let items = Array.from(coll.values());

    if (Array.isArray(queries)) {
      for (const q of queries) {
        if (typeof q === 'string') {
          try {
            const parsed = JSON.parse(q);
            if (parsed.method === 'equal') {
              items = items.filter((d) => d[parsed.attribute] === parsed.values[0]);
            } else if (parsed.method === 'orderAsc') {
              const attr = parsed.attribute || '$createdAt';
              items.sort((a, b) => (String(a[attr]) > String(b[attr]) ? 1 : -1));
            } else if (parsed.method === 'orderDesc') {
              const attr = parsed.attribute || '$createdAt';
              items.sort((a, b) => (String(a[attr]) < String(b[attr]) ? 1 : -1));
            } else if (parsed.method === 'limit') {
              items = items.slice(0, parsed.values[0]);
            }
          } catch {
            // ignore non-json query strings
          }
        }
      }
    }

    return {
      total: items.length,
      documents: JSON.parse(JSON.stringify(items)),
    };
  };

  clear() {
    this.collections.clear();
  }
}

const inMemoryDb = new InMemoryAppwriteDb();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: {
      getDocument: inMemoryDb.getDocument,
      createDocument: inMemoryDb.createDocument,
      updateDocument: inMemoryDb.updateDocument,
      listDocuments: inMemoryDb.listDocuments,
    },
  }),
}));

// --- Asaas PIX Mock ---
vi.mock('@/lib/asaas/pix', () => ({
  createPixPaymentOnSubaccount: vi.fn(),
  checkSubaccountPaymentStatus: vi.fn(),
}));

describe('Client PWA Orders & PIX End-to-End Integration Flow', () => {
  const tableToken = generateTableToken();
  const establishmentId = 'est_central_1';
  const tableId = 'tbl_mesa_7';
  const tableNumber = 7;
  const validCpf = '52998224725';

  // Coordenadas geográficas reais (Avenida Paulista, São Paulo)
  const establishmentCoords = {
    latitude: -23.561414,
    longitude: -46.655881,
  };

  // Coordenadas a ~20m de distância (dentro do raio de 250m)
  const clientNearCoords = {
    latitude: -23.5615,
    longitude: -46.6557,
  };

  // Coordenadas a ~1.2km de distância (fora do raio de 250m)
  const clientFarCoords = {
    latitude: -23.55052,
    longitude: -46.655881,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clientCookies.carlos.clear();
    clientCookies.ana.clear();
    inMemoryDb.clear();
    switchClientContext('carlos');

    // Seed: Estabelecimento com subconta Asaas e geolocalização
    inMemoryDb.seed(appwriteConfig.collections.establishments, {
      $id: establishmentId,
      name: 'Restaurante KeroKero Central',
      latitude: establishmentCoords.latitude,
      longitude: establishmentCoords.longitude,
      asaasSubaccountApiKey: 'subaccount_api_key_live_mock',
    });

    // Seed: Mesa 07 no estado inicial 'idle'
    inMemoryDb.seed(appwriteConfig.collections.tables, {
      $id: tableId,
      establishmentId,
      number: tableNumber,
      label: 'Mesa 07',
      token: tableToken,
      status: 'idle',
      activeSessionId: null,
      currentTotal: 0,
      isActive: true,
      lastActivityAt: new Date().toISOString(),
      serviceCallReason: null,
    });
  });

  it('executes full multi-client lifecycle: geofence validation, table join, orders, shared tab, PIX split settlement, and session teardown', async () => {
    // -------------------------------------------------------------------------
    // 1. validateClientLocation: Verificação de token e geofence indoor (250m)
    // -------------------------------------------------------------------------
    const invalidTokenRes = await validateClientLocation('invalid_hex_token', clientNearCoords);
    expect(invalidTokenRes.success).toBe(false);
    expect(invalidTokenRes.message).toMatch(/inválido/i);

    const farLocationRes = await validateClientLocation(tableToken, clientFarCoords);
    expect(farLocationRes.success).toBe(false);
    expect(farLocationRes.message).toMatch(/250m|estabelecimento/i);

    const validLocationRes = await validateClientLocation(tableToken, clientNearCoords);
    expect(validLocationRes.success).toBe(true);
    expect(validLocationRes.data).toEqual({
      tableId,
      tableNumber,
      establishmentId,
      establishmentName: 'Restaurante KeroKero Central',
    });

    // -------------------------------------------------------------------------
    // 2. joinTable: Carlos ingressa na mesa e inicializa a comanda coletiva
    // -------------------------------------------------------------------------
    switchClientContext('carlos');
    const carlosJoinRes = await joinTable(tableToken, 'Carlos', clientNearCoords);
    expect(carlosJoinRes.success).toBe(true);
    expect(carlosJoinRes.data).toBeDefined();

    const sessionId = carlosJoinRes.data!.session.$id;
    const carlosParticipantId = carlosJoinRes.data!.participantId;
    expect(carlosJoinRes.data!.participantName).toBe('Carlos');
    expect(carlosJoinRes.data!.tableNumber).toBe(tableNumber);

    // Verifica se o cookie HttpOnly foi gravado para Carlos
    const carlosCookie = clientCookies.carlos.get(PARTICIPANT_COOKIE_NAME);
    expect(carlosCookie).toBeDefined();

    // Verifica persistência no banco: mesa ocupada e sessão aberta
    const tableAfterCarlos = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tables, tableId);
    expect(tableAfterCarlos.status).toBe('occupied');
    expect(tableAfterCarlos.activeSessionId).toBe(sessionId);

    const sessionAfterCarlos = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    expect(sessionAfterCarlos.status).toBe('open');
    expect(sessionAfterCarlos.totalAmount).toBe(0);
    expect(sessionAfterCarlos.paidAmount).toBe(0);

    // -------------------------------------------------------------------------
    // 3. submitOrderAction: Carlos faz pedido de um Burger artesanal (R$ 35,00)
    // -------------------------------------------------------------------------
    const carlosOrderRes = await submitOrderAction([
      {
        productId: 'prod_burger_classic',
        productName: 'Burger Artesanal Defumado',
        unitPrice: 3500, // R$ 35,00
        quantity: 1,
        notes: 'Ponto da carne ao ponto, sem cebola',
      },
    ]);

    expect(carlosOrderRes.success).toBe(true);
    expect(carlosOrderRes.data?.orders).toHaveLength(1);
    const carlosOrder = carlosOrderRes.data!.orders[0];
    expect(carlosOrder.participantId).toBe(carlosParticipantId);
    expect(carlosOrder.productName).toBe('Burger Artesanal Defumado');
    expect(carlosOrder.totalPrice).toBe(3500);
    expect(carlosOrder.status).toBe('pending');

    // Verifica atualização no banco: status da mesa vai para 'order_placed' e total acumula R$ 35,00
    const tableAfterCarlosOrder = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tables, tableId);
    expect(tableAfterCarlosOrder.status).toBe('order_placed');
    expect(tableAfterCarlosOrder.currentTotal).toBe(3500);

    const sessionAfterCarlosOrder = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    expect(sessionAfterCarlosOrder.totalAmount).toBe(3500);

    // -------------------------------------------------------------------------
    // 4. joinTable: Ana escaneia o mesmo QR Code e ingressa na sessão existente
    // -------------------------------------------------------------------------
    switchClientContext('ana');
    const anaJoinRes = await joinTable(tableToken, 'Ana', clientNearCoords);
    expect(anaJoinRes.success).toBe(true);
    expect(anaJoinRes.data).toBeDefined();

    const anaParticipantId = anaJoinRes.data!.participantId;
    expect(anaJoinRes.data!.session.$id).toBe(sessionId); // Mesma comanda
    expect(anaJoinRes.data!.participantName).toBe('Ana');

    // Cookie gravado especificamente para o dispositivo/sessão de Ana
    const anaCookie = clientCookies.ana.get(PARTICIPANT_COOKIE_NAME);
    expect(anaCookie).toBeDefined();
    expect(anaCookie).not.toBe(carlosCookie);

    // Verifica que Carlos NÃO foi sobrescrito na comanda da mesa
    const sessionWithBoth = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    const participantsList = JSON.parse(sessionWithBoth.participants as string);
    expect(participantsList).toHaveLength(2);
    expect(participantsList.some((p: any) => p.id === carlosParticipantId && p.name === 'Carlos')).toBe(true);
    expect(participantsList.some((p: any) => p.id === anaParticipantId && p.name === 'Ana')).toBe(true);

    // -------------------------------------------------------------------------
    // 5. submitOrderAction: Ana pede um Suco Natural (R$ 10,00)
    // -------------------------------------------------------------------------
    const anaOrderRes = await submitOrderAction([
      {
        productId: 'prod_suco_laranja',
        productName: 'Suco Natural de Laranja',
        unitPrice: 1000, // R$ 10,00
        quantity: 1,
        notes: 'Com gelo',
      },
    ]);

    expect(anaOrderRes.success).toBe(true);
    expect(anaOrderRes.data?.orders).toHaveLength(1);
    const anaOrder = anaOrderRes.data!.orders[0];
    expect(anaOrder.participantId).toBe(anaParticipantId);
    expect(anaOrder.totalPrice).toBe(1000);

    // Total da mesa e sessão consolidados: R$ 35,00 + R$ 10,00 = R$ 45,00 (4500 centavos)
    const tableAfterAnaOrder = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tables, tableId);
    expect(tableAfterAnaOrder.currentTotal).toBe(4500);

    const sessionAfterAnaOrder = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    expect(sessionAfterAnaOrder.totalAmount).toBe(4500);

    // -------------------------------------------------------------------------
    // 6. Shared Table Tab: Carlos e Ana visualizam a comanda com visão individual e consolidada
    // -------------------------------------------------------------------------
    // Carlos visualiza a comanda:
    switchClientContext('carlos');
    const carlosTabRes = await getTableTabDataAction();
    expect(carlosTabRes.success).toBe(true);
    expect(carlosTabRes.data).toBeDefined();

    const carlosAllOrders = carlosTabRes.data!.orders;
    expect(carlosAllOrders).toHaveLength(2);

    const carlosMyOrders = filterParticipantOrders(carlosAllOrders, carlosParticipantId);
    expect(carlosMyOrders).toHaveLength(1);
    expect(carlosMyOrders[0].productName).toBe('Burger Artesanal Defumado');
    expect(calculateParticipantTotal(carlosAllOrders, carlosParticipantId)).toBe(3500); // R$ 35,00

    const carlosTableSummary = calculateTableSummary(carlosTabRes.data!.session, carlosAllOrders);
    expect(carlosTableSummary.totalAmount).toBe(4500); // R$ 45,00
    expect(carlosTableSummary.remainingBalance).toBe(4500);
    expect(carlosTableSummary.isFullyPaid).toBe(false);

    // Ana visualiza a comanda:
    switchClientContext('ana');
    const anaTabRes = await getTableTabDataAction();
    expect(anaTabRes.success).toBe(true);

    const anaMyOrders = filterParticipantOrders(anaTabRes.data!.orders, anaParticipantId);
    expect(anaMyOrders).toHaveLength(1);
    expect(anaMyOrders[0].productName).toBe('Suco Natural de Laranja');
    expect(calculateParticipantTotal(anaTabRes.data!.orders, anaParticipantId)).toBe(1000); // R$ 10,00

    const anaTableSummary = calculateTableSummary(anaTabRes.data!.session, anaTabRes.data!.orders);
    expect(anaTableSummary.totalAmount).toBe(4500); // R$ 45,00
    expect(anaTableSummary.remainingBalance).toBe(4500);

    // -------------------------------------------------------------------------
    // 7. requestPixCheckoutAction: Carlos solicita PIX para seus itens (R$ 35,00)
    // -------------------------------------------------------------------------
    switchClientContext('carlos');

    vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
      paymentId: 'pay_asaas_carlos_3500',
      pixQrCodeBase64: 'mock_base64_pix_qr_carlos',
      pixCopyPaste: '00020126...5802BR5925Carlos6009SaoPaulo62070503***6304ABCD',
      expirationDate: '2026-11-03 16:00:00',
    });

    const carlosPixRes = await requestPixCheckoutAction('my_items', validCpf);
    expect(carlosPixRes.success).toBe(true);
    expect(carlosPixRes.data?.paymentId).toBe('pay_asaas_carlos_3500');
    expect(carlosPixRes.data?.amountCents).toBe(3500);
    expect(carlosPixRes.data?.value).toBe(35);

    expect(asaasPix.createPixPaymentOnSubaccount).toHaveBeenCalledWith(
      'subaccount_api_key_live_mock',
      expect.objectContaining({
        customerName: 'Carlos',
        customerCpf: validCpf,
        value: 35,
        description: expect.stringContaining('Mesa 7'),
      }),
    );

    // -------------------------------------------------------------------------
    // 8. pollPixStatusAction: Carlos quita seus itens via PIX
    // -------------------------------------------------------------------------
    // Simula Asaas retornando status 'RECEIVED' (pago)
    vi.mocked(asaasPix.checkSubaccountPaymentStatus).mockResolvedValueOnce({
      status: 'RECEIVED',
      isPaid: true,
    });

    const carlosPollRes = await pollPixStatusAction('pay_asaas_carlos_3500', 3500);
    expect(carlosPollRes.success).toBe(true);
    expect(carlosPollRes.data?.isPaid).toBe(true);
    expect(carlosPollRes.data?.isParticipantSettled).toBe(true);
    expect(carlosPollRes.data?.sessionClosed).toBe(false); // Mesa ainda possui débito da Ana

    // Cookie de Carlos foi revogado após quitar sua conta
    // Carlos visualiza o comprovante e depois clica em "Finalizar"
    await clearClientSessionAction();
    expect(clientCookies.carlos.get(PARTICIPANT_COOKIE_NAME)).toBeUndefined();

    // Cookie de Ana permanece intacto
    expect(clientCookies.ana.get(PARTICIPANT_COOKIE_NAME)).toBeDefined();

    // Validação de estado no banco: sessão abatida para saldo remanescente de R$ 10,00
    const sessionAfterCarlosPay = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    expect(sessionAfterCarlosPay.status).toBe('open');
    expect(sessionAfterCarlosPay.paidAmount).toBe(3500);
    expect(sessionAfterCarlosPay.totalAmount).toBe(4500);

    const participantsAfterCarlosPay = JSON.parse(sessionAfterCarlosPay.participants as string);
    const carlosInSession = participantsAfterCarlosPay.find((p: any) => p.id === carlosParticipantId);
    const anaInSession = participantsAfterCarlosPay.find((p: any) => p.id === anaParticipantId);
    expect(carlosInSession.isPaid).toBe(true);
    expect(carlosInSession.paidAmount).toBe(3500);
    expect(anaInSession.isPaid).toBe(false);
    expect(anaInSession.paidAmount).toBe(0);

    // Carlos não consegue mais enviar novos pedidos (cookie revogado)
    const unauthorizedOrderRes = await submitOrderAction([
      {
        productId: 'prod_cafe',
        productName: 'Café Expresso',
        unitPrice: 600,
        quantity: 1,
      },
    ]);
    expect(unauthorizedOrderRes.success).toBe(false);
    expect(unauthorizedOrderRes.message).toMatch(/sessão/i);

    // -------------------------------------------------------------------------
    // 9. Ana paga os R$ 10,00 restantes, liquidando 100% da comanda e liberando a mesa
    // -------------------------------------------------------------------------
    switchClientContext('ana');

    vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
      paymentId: 'pay_asaas_ana_1000',
      pixQrCodeBase64: 'mock_base64_pix_qr_ana',
      pixCopyPaste: '00020126...5802BR5925Ana6009SaoPaulo62070503***6304EF01',
      expirationDate: '2026-11-03 16:05:00',
    });

    const anaPixRes = await requestPixCheckoutAction('my_items', validCpf);
    expect(anaPixRes.success).toBe(true);
    expect(anaPixRes.data?.amountCents).toBe(1000);
    expect(anaPixRes.data?.value).toBe(10);

    // Simula confirmação do pagamento no Asaas
    vi.mocked(asaasPix.checkSubaccountPaymentStatus).mockResolvedValueOnce({
      status: 'RECEIVED',
      isPaid: true,
    });

    const anaPollRes = await pollPixStatusAction('pay_asaas_ana_1000', 1000);
    expect(anaPollRes.success).toBe(true);
    expect(anaPollRes.data?.isPaid).toBe(true);
    expect(anaPollRes.data?.isParticipantSettled).toBe(true);
    expect(anaPollRes.data?.sessionClosed).toBe(true); // 100% liquidado!

    // Cookie de Ana também é revogado
    await clearClientSessionAction();
    expect(clientCookies.ana.get(PARTICIPANT_COOKIE_NAME)).toBeUndefined();

    // Validação no banco: sessão encerrada ('closed') com 100% pago
    const finalSession = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    expect(finalSession.status).toBe('closed');
    expect(finalSession.paidAmount).toBe(4500);
    expect(finalSession.totalAmount).toBe(4500);
    expect(finalSession.closedAt).toBeDefined();

    // Mesa física liberada de volta para status 'idle' pronta para novos clientes
    const finalTable = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tables, tableId);
    expect(finalTable.status).toBe('idle');
    expect(finalTable.activeSessionId).toBeNull();
    expect(finalTable.currentTotal).toBe(0);
    expect(finalTable.serviceCallReason).toBeNull();
  });

  it('handles bill splitting calculation among unpaid participants', async () => {
    // Ingresso de Carlos e Ana
    switchClientContext('carlos');
    const cJoin = await joinTable(tableToken, 'Carlos', clientNearCoords);
    const sessionId = cJoin.data!.session.$id;

    switchClientContext('ana');
    await joinTable(tableToken, 'Ana', clientNearCoords);

    // Pedido compartilhado de Pizza Grande R$ 80,00 (8000 centavos)
    switchClientContext('carlos');
    await submitOrderAction([
      {
        productId: 'prod_pizza_grande',
        productName: 'Pizza Quatro Queijos Grande',
        unitPrice: 8000,
        quantity: 1,
      },
    ]);

    // Carlos escolhe pagar no modo 'split' (dividir igualmente entre os 2 participantes não quitados)
    vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
      paymentId: 'pay_split_carlos',
      pixQrCodeBase64: 'qr_carlos_split',
      pixCopyPaste: 'copy_carlos_split',
      expirationDate: '2026-11-03 16:30:00',
    });

    const carlosSplitPix = await requestPixCheckoutAction('split', validCpf);
    expect(carlosSplitPix.success).toBe(true);
    // 8000 centavos / 2 participantes = 4000 centavos (R$ 40,00)
    expect(carlosSplitPix.data?.amountCents).toBe(4000);
    expect(carlosSplitPix.data?.value).toBe(40);

    // Carlos quita sua metade
    vi.mocked(asaasPix.checkSubaccountPaymentStatus).mockResolvedValueOnce({
      status: 'RECEIVED',
      isPaid: true,
    });
    const carlosPoll = await pollPixStatusAction('pay_split_carlos', 4000);
    expect(carlosPoll.data?.isPaid).toBe(true);
    expect(carlosPoll.data?.sessionClosed).toBe(false);

    // Ana consulta o modo 'split' agora: restam 4000 centavos e apenas 1 não quitado (Ana)
    switchClientContext('ana');
    vi.mocked(asaasPix.createPixPaymentOnSubaccount).mockResolvedValueOnce({
      paymentId: 'pay_split_ana',
      pixQrCodeBase64: 'qr_ana_split',
      pixCopyPaste: 'copy_ana_split',
      expirationDate: '2026-11-03 16:30:00',
    });

    const anaSplitPix = await requestPixCheckoutAction('split', validCpf);
    expect(anaSplitPix.success).toBe(true);
    expect(anaSplitPix.data?.amountCents).toBe(4000);
    expect(anaSplitPix.data?.value).toBe(40);

    // Ana quita sua metade
    vi.mocked(asaasPix.checkSubaccountPaymentStatus).mockResolvedValueOnce({
      status: 'RECEIVED',
      isPaid: true,
    });
    const anaPoll = await pollPixStatusAction('pay_split_ana', 4000);
    expect(anaPoll.data?.sessionClosed).toBe(true);

    const sessionDoc = await inMemoryDb.getDocument('kerokero', appwriteConfig.collections.tableSessions, sessionId);
    expect(sessionDoc.status).toBe('closed');
    expect(sessionDoc.paidAmount).toBe(8000);
  });
});
