import crypto from 'node:crypto';
import { ID, Query, Models } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import { resetTableSession } from './tables';

export interface SessionParticipant {
  id: string;
  name: string;
  joinedAt: string;
  isPaid: boolean;
  paidAmount: number;
}

export interface TableSessionDocument extends Models.DefaultDocument {
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
