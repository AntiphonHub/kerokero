import { ID, Query, Models } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface CreateOrderInput {
  establishmentId: string;
  tableId: string;
  tableNumber: number;
  sessionId: string;
  participantId: string;
  participantName: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice?: number;
  notes?: string;
  selectedOptions?: string | Record<string, unknown> | Array<unknown>;
}

export interface OrderDocument extends Models.DefaultDocument {
  establishmentId: string;
  tableId: string;
  tableNumber: number;
  sessionId: string;
  participantId: string;
  participantName: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
  selectedOptions?: string;
  status: OrderStatus;
  createdAt: string;
}

function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function formatSelectedOptions(options: unknown): string {
  if (typeof options === 'string') {
    return options;
  }
  if (options && typeof options === 'object') {
    return JSON.stringify(options);
  }
  return '';
}

/**
 * Cria um pedido individual para o participante na coleção de pedidos dedicada ('orders')
 * e incrementa os totais da comanda da mesa e da mesa física.
 */
export async function createOrder(orderData: CreateOrderInput): Promise<OrderDocument> {
  const { databases } = createAdminClient();

  const totalPrice = orderData.totalPrice ?? orderData.unitPrice * orderData.quantity;
  const selectedOptions = formatSelectedOptions(orderData.selectedOptions);
  const nowIso = new Date().toISOString();

  const orderPayload = {
    establishmentId: orderData.establishmentId,
    tableId: orderData.tableId,
    tableNumber: orderData.tableNumber,
    sessionId: orderData.sessionId,
    participantId: orderData.participantId,
    participantName: orderData.participantName,
    productId: orderData.productId,
    productName: orderData.productName,
    unitPrice: orderData.unitPrice,
    quantity: orderData.quantity,
    totalPrice,
    notes: orderData.notes || '',
    selectedOptions,
    status: 'pending' as OrderStatus,
    createdAt: nowIso,
  };

  const createdDoc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    ID.unique(),
    orderPayload,
  );

  // 1. Atualiza total acumulado na sessão da mesa
  try {
    const sessionDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      orderData.sessionId,
    );
    const newSessionTotal = (sessionDoc.totalAmount || 0) + totalPrice;
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tableSessions,
      orderData.sessionId,
      { totalAmount: newSessionTotal },
    );
  } catch {
    // Falha silenciosa no incremento para manter criação do pedido
  }

  // 2. Atualiza status e total da mesa física
  try {
    const tableDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tables,
      orderData.tableId,
    );
    const newTableTotal = (tableDoc.currentTotal || 0) + totalPrice;
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tables,
      orderData.tableId,
      {
        currentTotal: newTableTotal,
        status: 'order_placed',
        lastActivityAt: nowIso,
      },
    );
  } catch {
    // Falha silenciosa no incremento para manter criação do pedido
  }

  return toPlainObject<OrderDocument>(createdDoc);
}

/**
 * Lista todos os pedidos pertencentes a uma sessão de comanda, ordenados por data de criação.
 */
export async function listSessionOrders(sessionId: string): Promise<OrderDocument[]> {
  const { databases } = createAdminClient();

  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [
      Query.equal('sessionId', sessionId),
      Query.orderAsc('$createdAt'),
      Query.limit(500),
    ],
  );

  return toPlainObject<OrderDocument[]>(res.documents);
}

/**
 * Lista apenas os pedidos feitos por um participante específico em uma sessão.
 */
export async function listParticipantOrders(
  sessionId: string,
  participantId: string,
): Promise<OrderDocument[]> {
  const { databases } = createAdminClient();

  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [
      Query.equal('sessionId', sessionId),
      Query.equal('participantId', participantId),
      Query.orderAsc('$createdAt'),
      Query.limit(500),
    ],
  );

  return toPlainObject<OrderDocument[]>(res.documents);
}

/**
 * Atualiza o status de um pedido no KDS / Cozinha.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<OrderDocument> {
  const { databases } = createAdminClient();

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    orderId,
    { status },
  );

  return toPlainObject<OrderDocument>(updated);
}

/**
 * Busca um pedido pelo ID.
 */
export async function getOrderById(orderId: string): Promise<OrderDocument | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.orders,
      orderId,
    );
    return toPlainObject<OrderDocument>(doc);
  } catch {
    return null;
  }
}
