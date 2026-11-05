import { OrderDocument, OrderStatus } from '@/lib/appwrite/orders';

export type OrderUrgency = 'normal' | 'warning' | 'critical';

/**
 * Calcula o nível de urgência com base no tempo decorrido desde a realização do pedido.
 * - < 15 minutos: 'normal'
 * - 15 a 30 minutos: 'warning'
 * - > 30 minutos: 'critical'
 */
export function calculateOrderUrgency(createdAt: string): OrderUrgency {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - createdTime) / (1000 * 60));

  if (diffMinutes < 15) {
    return 'normal';
  }
  if (diffMinutes <= 30) {
    return 'warning';
  }
  return 'critical';
}

/**
 * Formata o tempo decorrido em texto amigável:
 * - < 1 min: 'agora'
 * - < 60 min: 'X min'
 * - >= 60 min: 'Xh Ym'
 */
export function formatElapsedTime(createdAt: string): string {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - createdTime) / (1000 * 60));

  if (diffMinutes < 1) {
    return 'agora';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Converte `selectedOptions` (que pode ser string JSON ou texto) em lista de strings legíveis.
 */
export function parseSelectedOptions(options?: string | null): string[] {
  if (!options) return [];
  const trimmed = options.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, val]) => `${key}: ${String(val)}`);
    }
  } catch {
    // Não é JSON, retorna como texto puro
  }

  return [trimmed];
}

export interface TableOrdersGroup {
  tableId: string;
  tableNumber: number;
  oldestCreatedAt: string;
  orders: OrderDocument[];
}

/**
 * Agrupa pedidos por mesa e ordena os grupos pelo pedido mais antigo primeiro (FIFO).
 */
export function groupOrdersByTable(orders: OrderDocument[]): TableOrdersGroup[] {
  const groupsMap = new Map<string, { tableNumber: number; oldestCreatedAt: string; orders: OrderDocument[] }>();

  for (const order of orders) {
    const existing = groupsMap.get(order.tableId);
    if (!existing) {
      groupsMap.set(order.tableId, {
        tableNumber: order.tableNumber,
        oldestCreatedAt: order.createdAt || order.$createdAt,
        orders: [order],
      });
    } else {
      existing.orders.push(order);
      const orderTime = new Date(order.createdAt || order.$createdAt).getTime();
      const oldestTime = new Date(existing.oldestCreatedAt).getTime();
      if (orderTime < oldestTime) {
        existing.oldestCreatedAt = order.createdAt || order.$createdAt;
      }
    }
  }

  const groups: TableOrdersGroup[] = Array.from(groupsMap.entries()).map(([tableId, data]) => ({
    tableId,
    tableNumber: data.tableNumber,
    oldestCreatedAt: data.oldestCreatedAt,
    orders: data.orders,
  }));

  // Ordena mesas pelo pedido mais antigo primeiro
  groups.sort(
    (a, b) => new Date(a.oldestCreatedAt).getTime() - new Date(b.oldestCreatedAt).getTime()
  );

  return groups;
}

export interface KitchenItemSummary {
  productName: string;
  quantity: number;
}

/**
 * Consolida as quantidades totais de itens com status 'pending' ou 'preparing',
 * ordenando pelos itens com maior volume de produção.
 */
export function aggregateKitchenItems(orders: OrderDocument[]): KitchenItemSummary[] {
  const itemMap = new Map<string, number>();

  for (const order of orders) {
    if (order.status === 'pending' || order.status === 'preparing') {
      const current = itemMap.get(order.productName) || 0;
      itemMap.set(order.productName, current + (order.quantity || 1));
    }
  }

  const result: KitchenItemSummary[] = Array.from(itemMap.entries()).map(
    ([productName, quantity]) => ({
      productName,
      quantity,
    })
  );

  result.sort((a, b) => b.quantity - a.quantity);
  return result;
}

/**
 * Próximo status no fluxo da cozinha:
 * pending -> preparing -> ready -> delivered -> null
 */
export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'delivered';
    default:
      return null;
  }
}

/**
 * Status anterior caso o operador precise retroceder:
 * delivered -> ready -> preparing -> pending -> null
 */
export function getPreviousOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'preparing':
      return 'pending';
    case 'ready':
      return 'preparing';
    case 'delivered':
      return 'ready';
    default:
      return null;
  }
}
