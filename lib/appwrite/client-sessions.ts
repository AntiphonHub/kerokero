import crypto from 'node:crypto';
import { ID, Query, Models } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import { resetTableSession, type TableDocument } from './tables';
import type { OrderDocument } from './orders';

export interface SessionParticipant {
  id: string;
  name: string;
  joinedAt: string;
  isPaid: boolean;
  paidAmount: number;
}

export type PaymentMethodType = 'pix_asaas' | 'pos_card' | 'cash' | 'mixed';

export interface TableSessionDocument extends Models.DefaultDocument {
  pixPaidAmount?: number;
  posPaidAmount?: number;
  paymentMethod?: PaymentMethodType;
  establishmentId: string;
  tableId: string;
  tableNumber: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string | null;
  participants: string;
  totalAmount: number;
  paidAmount: number;
}

import { parseSessionParticipants } from '@/lib/utils/tab';
export { parseSessionParticipants };
function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}



export function deduplicateNickname(
  existingParticipants: SessionParticipant[],
  desiredName: string,
): string {
  const trimmed = desiredName.trim() || 'Cliente';
  const existingNames = new Set(existingParticipants.map((p) => p.name.trim()));

  if (!existingNames.has(trimmed)) {
    return trimmed;
  }

  let counter = 2;
  while (existingNames.has(`${trimmed} (${counter})`)) {
    counter++;
  }
  return `${trimmed} (${counter})`;
}

/**
 * Adiciona um participante a uma sessão de mesa existente ou cria uma nova comanda caso não haja sessão aberta.
 */
export async function joinTableSession(
  establishmentId: string,
  tableId: string,
  tableNumber: number,
  nickname: string,
): Promise<{ session: TableSessionDocument; participantId: string; participantName: string }> {
  const { databases } = createAdminClient();

  let session: TableSessionDocument | null = null;

  // 1. Verifica se a mesa possui activeSessionId válido e aberto
  try {
    const tableDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tables,
      tableId,
    );

    if (tableDoc.activeSessionId) {
      try {
        const fetchedSession = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.tableSessions,
          tableDoc.activeSessionId,
        );
        if (fetchedSession && fetchedSession.status === 'open') {
          session = toPlainObject<TableSessionDocument>(fetchedSession);
        }
      } catch {
        // Sessão apontada não existe ou erro de leitura
      }
    }
  } catch {
    // Falha ao obter dados da mesa
  }

  // 2. Se não encontrou pelo activeSessionId, busca sessão aberta na coleção
  if (!session) {
    const activeRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      [
        Query.equal('tableId', tableId),
        Query.equal('status', 'open'),
        Query.limit(1),
      ],
    );
    if (activeRes.total > 0 && activeRes.documents[0]) {
      session = toPlainObject<TableSessionDocument>(activeRes.documents[0]);
    }
  }

  const participantId = crypto.randomUUID();

  // 3. Caso exista sessão aberta, inclui o participante com apelido deduplicado
  if (session) {
    const participants = parseSessionParticipants(session.participants);
    const participantName = deduplicateNickname(participants, nickname);

    const newParticipant: SessionParticipant = {
      id: participantId,
      name: participantName,
      joinedAt: new Date().toISOString(),
      isPaid: false,
      paidAmount: 0,
    };

    participants.push(newParticipant);

    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      session.$id,
      {
        participants: JSON.stringify(participants),
      },
    );

    return {
      session: toPlainObject<TableSessionDocument>(updated),
      participantId,
      participantName,
    };
  }

  // 4. Se não existe sessão aberta, cria uma nova e ocupa a mesa
  const participantName = nickname.trim() || 'Cliente';
  const newParticipant: SessionParticipant = {
    id: participantId,
    name: participantName,
    joinedAt: new Date().toISOString(),
    isPaid: false,
    paidAmount: 0,
  };

  const newSession = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tableSessions,
    ID.unique(),
    {
      establishmentId,
      tableId,
      tableNumber,
      status: 'open',
      openedAt: new Date().toISOString(),
      closedAt: null,
      participants: JSON.stringify([newParticipant]),
      totalAmount: 0,
      paidAmount: 0,
    },
  );

  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    tableId,
    {
      status: 'occupied',
      activeSessionId: newSession.$id,
      lastActivityAt: new Date().toISOString(),
    },
  );

  return {
    session: toPlainObject<TableSessionDocument>(newSession),
    participantId,
    participantName,
  };
}

/**
 * Liquida ou abate o pagamento de um participante e fecha a comanda caso 100% quitada.
 */
export async function settleParticipantPayment(
  sessionId: string,
  participantId: string,
  amountCents: number,
): Promise<TableSessionDocument> {
  const { databases } = createAdminClient();

  const sessionDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tableSessions,
    sessionId,
  );

  const participants = parseSessionParticipants(sessionDoc.participants);
  const participant = participants.find((p) => p.id === participantId);

  if (participant) {
    participant.isPaid = true;
    participant.paidAmount = (participant.paidAmount || 0) + amountCents;
  }

  const newPaidAmount = (sessionDoc.paidAmount || 0) + amountCents;
  const isFullyPaid = sessionDoc.totalAmount > 0 && newPaidAmount >= sessionDoc.totalAmount;
  const newPixPaidAmount = (sessionDoc.pixPaidAmount || 0) + amountCents;
  const currentPosPaid = sessionDoc.posPaidAmount || 0;
  const paymentMethod: PaymentMethodType = currentPosPaid > 0 ? 'mixed' : 'pix_asaas';
  const status = isFullyPaid ? 'closed' : sessionDoc.status;
  const closedAt = isFullyPaid ? new Date().toISOString() : sessionDoc.closedAt || null;

  const updatedSession = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tableSessions,
    sessionId,
    {
      participants: JSON.stringify(participants),
      paidAmount: newPaidAmount,
      status,
      closedAt,
    },
  );

  if (isFullyPaid && sessionDoc.tableId) {
    try {
      await resetTableSession(sessionDoc.tableId);
    } catch {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        sessionDoc.tableId,
        {
          status: 'idle',
          activeSessionId: null,
          currentTotal: 0,
          serviceCallReason: null,
          lastActivityAt: new Date().toISOString(),
        },
      );
    }
  }

  return toPlainObject<TableSessionDocument>(updatedSession);
}

/**
 * Busca uma sessão pelo ID.
 */
export async function getTableSession(sessionId: string): Promise<TableSessionDocument | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      sessionId,
    );
    return toPlainObject<TableSessionDocument>(doc);
  } catch {
    return null;
  }
}

/**
 * Busca a sessão ativa/aberta de uma mesa.
 */
export async function getActiveTableSession(tableId: string): Promise<TableSessionDocument | null> {
  const { databases } = createAdminClient();
  try {
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      [
        Query.equal('tableId', tableId),
        Query.equal('status', 'open'),
        Query.limit(1),
      ],
    );
    if (res.total === 0 || !res.documents[0]) {
      return null;
    }
    return toPlainObject<TableSessionDocument>(res.documents[0]);
  } catch {
    return null;
  }
}


/**
 * Quita 100% da comanda da mesa, marca todos os participantes como pagos e encerra a sessão.
 * Também conclui os chamados pendentes e libera a mesa de volta para idle.
 */
export async function closeAndSettleEntireTableSession(
  tableId: string,
  paymentMethodOption: 'pos_card' | 'cash' = 'pos_card',
): Promise<{ table: TableDocument; session: TableSessionDocument | null }> {
  const { databases } = createAdminClient();

  // 1. Busca a mesa
  const tableDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    tableId,
  );

  let sessionDoc: Models.Document | null = null;

  // Busca a sessão ativa
  if (tableDoc.activeSessionId) {
    try {
      sessionDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tableSessions,
        tableDoc.activeSessionId,
      );
    } catch {
      sessionDoc = null;
    }
  }

  if (!sessionDoc) {
    // Tenta buscar por tableId com status 'open'
    const openSessions = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      [Query.equal('tableId', tableId), Query.equal('status', 'open'), Query.limit(1)],
    );
    if (openSessions.documents.length > 0) {
      sessionDoc = openSessions.documents[0];
    }
  }

  let updatedSession: TableSessionDocument | null = null;

  if (sessionDoc) {
    const sessionObj = toPlainObject<TableSessionDocument>(sessionDoc);
    const participants = parseSessionParticipants(sessionObj.participants);

    // Busca os pedidos da sessão para calcular os valores exatos de cada participante
    let orders: OrderDocument[] = [];
    try {
      const ordersRes = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        [Query.equal('sessionId', sessionObj.$id), Query.limit(100)],
      );
      orders = toPlainObject<OrderDocument[]>(ordersRes.documents);
    } catch {}

    const calculatedTotal = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (o.totalPrice || o.unitPrice * o.quantity), 0);

    const finalTotal = sessionObj.totalAmount > 0 ? sessionObj.totalAmount : calculatedTotal;

    // Marca todos os participantes como pagos
    const settledParticipants = participants.map((p) => {
      const participantOrders = orders.filter(
        (o) => o.participantId === p.id && o.status !== 'cancelled',
      );
      const participantTotal = participantOrders.reduce(
        (acc, o) => acc + (o.totalPrice || o.unitPrice * o.quantity),
        0,
      );
      return {
        ...p,
        isPaid: true,
        paidAmount: Math.max(p.paidAmount || 0, participantTotal),
      };
    });

    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      sessionObj.$id,
      {
        status: 'closed',
        closedAt: new Date().toISOString(),
        totalAmount: finalTotal,
        paidAmount: finalTotal,
        participants: JSON.stringify(settledParticipants),
      },
    );

    updatedSession = toPlainObject<TableSessionDocument>(updated);
  }

  // 2. Conclui todos os chamados pendentes da mesa
  try {
    const pendingCalls = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.serviceCalls,
      [Query.equal('tableId', tableId), Query.equal('status', 'pending'), Query.limit(50)],
    );

    for (const call of pendingCalls.documents) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.serviceCalls,
        call.$id,
        { status: 'completed' },
      );
    }
  } catch (err) {
    console.warn('[closeAndSettleEntireTableSession] Falha ao resolver chamados:', err);
  }

  // 3. Reseta e libera a mesa de volta para 'idle'
  const updatedTable = await resetTableSession(tableId);

  return {
    table: updatedTable,
    session: updatedSession,
  };
}
