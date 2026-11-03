import { ID, Query, Models } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import { generateTableToken } from '@/lib/security/table-token';
import { TableStatus } from '@/lib/schemas/table';

export interface TableDocument extends Models.DefaultDocument {
  establishmentId: string;
  number: number;
  label: string;
  token: string;
  status: TableStatus;
  activeSessionId?: string | null;
  currentTotal: number;
  lastActivityAt?: string;
  serviceCallReason?: string | null;
  isActive: boolean;
}

export interface ServiceCallDocument extends Models.DefaultDocument {
  establishmentId: string;
  tableId: string;
  tableNumber: number;
  sessionId?: string;
  type: 'waiter' | 'bill_card' | 'custom';
  description?: string;
  requestedBy: string;
  status: 'pending' | 'in_progress' | 'completed';
}

function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Garante a criação de mesas de 1 até `count` para um estabelecimento de forma idempotente.
 * Se já existirem mesas, cria apenas as faltantes sem alterar os tokens das mesas existentes.
 */
export async function ensureEstablishmentTables(
  establishmentId: string,
  count: number,
): Promise<TableDocument[]> {
  const { databases } = createAdminClient();

  const existingRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    [
      Query.equal('establishmentId', establishmentId),
      Query.limit(500),
      Query.orderAsc('number'),
    ],
  );

  const existingTables = existingRes.documents as unknown as TableDocument[];
  const existingNumbers = new Set(existingTables.map((t) => t.number));

  const missingNumbers: number[] = [];
  for (let i = 1; i <= count; i++) {
    if (!existingNumbers.has(i)) {
      missingNumbers.push(i);
    }
  }

  // Cria as mesas faltantes em paralelo
  if (missingNumbers.length > 0) {
    const createPromises = missingNumbers.map((num) => {
      const paddedNumber = String(num).padStart(2, '0');
      const payload = {
        establishmentId,
        number: num,
        label: `Mesa ${paddedNumber}`,
        token: generateTableToken(),
        status: 'idle',
        activeSessionId: null,
        currentTotal: 0,
        lastActivityAt: new Date().toISOString(),
        serviceCallReason: null,
        isActive: true,
      };

      return databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tables,
        ID.unique(),
        payload,
      );
    });

    await Promise.allSettled(createPromises);

    // Recarrega a lista consolidada
    const updatedRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tables,
      [
        Query.equal('establishmentId', establishmentId),
        Query.limit(500),
        Query.orderAsc('number'),
      ],
    );

    return toPlainObject<TableDocument[]>(updatedRes.documents);
  }

  return toPlainObject<TableDocument[]>(existingTables);
}

/**
 * Retorna todas as mesas ativas de um estabelecimento.
 */
export async function listEstablishmentTables(
  establishmentId: string,
): Promise<TableDocument[]> {
  const { databases } = createAdminClient();

  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    [
      Query.equal('establishmentId', establishmentId),
      Query.limit(500),
      Query.orderAsc('number'),
    ],
  );

  return toPlainObject<TableDocument[]>(res.documents);
}

/**
 * Busca uma mesa pelo ID.
 */
export async function getTableById(tableId: string): Promise<TableDocument | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tables,
      tableId,
    );
    return toPlainObject<TableDocument>(doc);
  } catch {
    return null;
  }
}

/**
 * Busca uma mesa pelo token criptográfico único.
 */
export async function getTableByToken(token: string): Promise<TableDocument | null> {
  const { databases } = createAdminClient();

  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    [Query.equal('token', token), Query.limit(1)],
  );

  if (res.total === 0 || !res.documents[0]) {
    return null;
  }

  return toPlainObject<TableDocument>(res.documents[0]);
}

/**
 * Atualiza o status e informações operacionais da mesa.
 */
export async function updateTableStatus(
  tableId: string,
  data: {
    status: TableStatus;
    serviceCallReason?: string | null;
    currentTotal?: number;
    activeSessionId?: string | null;
  },
): Promise<TableDocument> {
  const { databases } = createAdminClient();

  const payload: Record<string, unknown> = {
    status: data.status,
    lastActivityAt: new Date().toISOString(),
  };

  if (data.serviceCallReason !== undefined) {
    payload.serviceCallReason = data.serviceCallReason;
  }
  if (data.currentTotal !== undefined) {
    payload.currentTotal = data.currentTotal;
  }
  if (data.activeSessionId !== undefined) {
    payload.activeSessionId = data.activeSessionId;
  }

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    tableId,
    payload,
  );

  return toPlainObject<TableDocument>(updated);
}

/**
 * Cria um chamado de serviço (Garçom ou Maquininha) e atualiza o status da mesa.
 */
export async function createServiceCall(data: {
  establishmentId: string;
  tableId: string;
  tableNumber: number;
  sessionId?: string;
  type: 'waiter' | 'bill_card' | 'custom';
  description?: string;
  requestedBy: string;
}): Promise<ServiceCallDocument> {
  const { databases } = createAdminClient();

  const callDoc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.serviceCalls,
    ID.unique(),
    {
      ...data,
      status: 'pending',
    },
  );

  const newStatus: TableStatus =
    data.type === 'bill_card' ? 'bill_requested' : 'waiter_called';

  const reason =
    data.type === 'bill_card'
      ? 'Aguardando Maquininha'
      : data.description || 'Chamou o Garçom';

  await updateTableStatus(data.tableId, {
    status: newStatus,
    serviceCallReason: reason,
  });

  return toPlainObject<ServiceCallDocument>(callDoc);
}

/**
 * Lista todos os chamados ativos de uma mesa.
 */
export async function listTableServiceCalls(
  tableId: string,
): Promise<ServiceCallDocument[]> {
  const { databases } = createAdminClient();

  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.serviceCalls,
    [
      Query.equal('tableId', tableId),
      Query.equal('status', 'pending'),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ],
  );

  return toPlainObject<ServiceCallDocument[]>(res.documents);
}

/**
 * Conclui um chamado de serviço e atualiza o status da mesa caso não haja outros chamados pendentes.
 */
export async function resolveServiceCall(
  callId: string,
  tableId: string,
  fallbackStatus: TableStatus = 'occupied',
): Promise<void> {
  const { databases } = createAdminClient();

  // 1. Marca chamado como concluído
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.serviceCalls,
    callId,
    { status: 'completed' },
  );

  // 2. Verifica se ainda existem chamados pendentes para esta mesa
  const pendingCalls = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.serviceCalls,
    [
      Query.equal('tableId', tableId),
      Query.equal('status', 'pending'),
      Query.limit(1),
    ],
  );

  // Se não houver chamados pendentes, retorna a mesa para o fallbackStatus e limpa o motivo
  if (pendingCalls.total === 0) {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tables,
      tableId,
      {
        status: fallbackStatus,
        serviceCallReason: null,
        lastActivityAt: new Date().toISOString(),
      },
    );
  }
}

/**
 * Reseta e libera uma mesa física de volta para o estado `idle`.
 */
export async function resetTableSession(tableId: string): Promise<TableDocument> {
  const { databases } = createAdminClient();

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    tableId,
    {
      status: 'idle',
      activeSessionId: null,
      currentTotal: 0,
      serviceCallReason: null,
      lastActivityAt: new Date().toISOString(),
    },
  );

  return toPlainObject<TableDocument>(updated);
}
