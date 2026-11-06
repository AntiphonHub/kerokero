import { Query } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import type { OrderDocument } from './orders';
import type { TableDocument, ServiceCallDocument } from './tables';

export type DashboardRange = 'today' | 'yesterday' | '7d';

export interface DashboardMetrics {
  totalRevenue: number;
  averageTicket: number;
  uniqueSessionsCount: number;
  totalItemsCount: number;
}

export interface SalesTimePoint {
  label: string;
  revenue: number;
  ordersCount: number;
}

export interface TopProductMetric {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface LiveStatusMetrics {
  totalTables: number;
  occupiedTables: number;
  occupancyRate: number;
  pendingServiceCallsCount: number;
}

export interface DashboardData {
  range: DashboardRange;
  metrics: DashboardMetrics;
  salesOverTime: SalesTimePoint[];
  topProducts: TopProductMetric[];
  liveStatus: LiveStatusMetrics;
  recentServiceCalls: ServiceCallDocument[];
}

function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Retorna ano, mês e dia no fuso horário oficial de Brasília (America/Sao_Paulo).
 */
export function getBrasiliaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.format(date); // "YYYY-MM-DD"
  const [year, month, day] = parts.split('-').map(Number);
  return { year, month, day, dateStr: parts };
}

/**
 * Calcula os limites ISO UTC para os intervalos de 'today', 'yesterday' ou '7d'
 * respeitando o fuso horário de Brasília (UTC-3).
 */
export function getDateRangeBoundaries(
  range: DashboardRange = 'today',
  referenceDate: Date = new Date(),
): { startDateIso: string; endDateIso: string; validRange: DashboardRange } {
  const validRange: DashboardRange =
    range === 'yesterday' || range === '7d' ? range : 'today';

  const { dateStr } = getBrasiliaDateParts(referenceDate);

  if (validRange === 'today') {
    const start = new Date(`${dateStr}T00:00:00.000-03:00`);
    const end = new Date(`${dateStr}T23:59:59.999-03:00`);
    return {
      startDateIso: start.toISOString(),
      endDateIso: end.toISOString(),
      validRange,
    };
  }

  if (validRange === 'yesterday') {
    const ref = new Date(`${dateStr}T12:00:00.000-03:00`);
    ref.setDate(ref.getDate() - 1);
    const yParts = getBrasiliaDateParts(ref);
    const start = new Date(`${yParts.dateStr}T00:00:00.000-03:00`);
    const end = new Date(`${yParts.dateStr}T23:59:59.999-03:00`);
    return {
      startDateIso: start.toISOString(),
      endDateIso: end.toISOString(),
      validRange,
    };
  }

  // 7d: 6 dias atrás às 00:00 até hoje às 23:59
  const ref = new Date(`${dateStr}T12:00:00.000-03:00`);
  ref.setDate(ref.getDate() - 6);
  const startParts = getBrasiliaDateParts(ref);
  const start = new Date(`${startParts.dateStr}T00:00:00.000-03:00`);
  const end = new Date(`${dateStr}T23:59:59.999-03:00`);

  return {
    startDateIso: start.toISOString(),
    endDateIso: end.toISOString(),
    validRange,
  };
}

/**
 * Agrega pedidos calculando faturamento bruto, ticket médio por comanda única,
 * top 5 produtos por faturamento e curva temporal de vendas.
 */
export function aggregateOrdersMetrics(
  orders: OrderDocument[],
  range: DashboardRange = 'today',
  referenceDate: Date = new Date(),
): {
  metrics: DashboardMetrics;
  salesOverTime: SalesTimePoint[];
  topProducts: TopProductMetric[];
} {
  const validOrders = orders.filter((o) => o.status !== 'cancelled');

  let totalRevenue = 0;
  let totalItemsCount = 0;
  const uniqueSessions = new Set<string>();
  const productMap = new Map<string, { productId: string; productName: string; revenue: number; quantity: number }>();

  // 1. Inicializa slots temporais
  let salesOverTime: SalesTimePoint[] = [];

  if (range === '7d') {
    const { dateStr } = getBrasiliaDateParts(referenceDate);
    const baseDate = new Date(`${dateStr}T12:00:00.000-03:00`);
    const dayMap = new Map<string, SalesTimePoint>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const parts = getBrasiliaDateParts(d);
      const label = `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}`;
      dayMap.set(parts.dateStr, { label, revenue: 0, ordersCount: 0 });
    }

    salesOverTime = Array.from(dayMap.values());

    for (const order of validOrders) {
      const orderPrice = order.totalPrice ?? (order.unitPrice || 0) * (order.quantity || 1);
      const orderDate = new Date(order.createdAt || order.$createdAt);
      const { dateStr } = getBrasiliaDateParts(orderDate);

      const slot = dayMap.get(dateStr);
      if (slot) {
        slot.revenue += orderPrice;
        slot.ordersCount += 1;
      }
    }
  } else {
    // 24 horas (00h a 23h)
    salesOverTime = Array.from({ length: 24 }, (_, i) => ({
      label: `${String(i).padStart(2, '0')}h`,
      revenue: 0,
      ordersCount: 0,
    }));

    for (const order of validOrders) {
      const orderPrice = order.totalPrice ?? (order.unitPrice || 0) * (order.quantity || 1);
      const orderDate = new Date(order.createdAt || order.$createdAt);
      // Extrai hora em America/Sao_Paulo
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false,
      }).format(orderDate);
      const hour = parseInt(hourStr, 10);

      if (hour >= 0 && hour < 24) {
        salesOverTime[hour].revenue += orderPrice;
        salesOverTime[hour].ordersCount += 1;
      }
    }
  }

  // 2. Acumula totais e produtos
  for (const order of validOrders) {
    const price = order.totalPrice ?? (order.unitPrice || 0) * (order.quantity || 1);
    const qty = order.quantity || 1;

    totalRevenue += price;
    totalItemsCount += qty;

    if (order.sessionId) {
      uniqueSessions.add(order.sessionId);
    }

    const currentProd = productMap.get(order.productId) || {
      productId: order.productId,
      productName: order.productName || 'Produto',
      revenue: 0,
      quantity: 0,
    };
    currentProd.revenue += price;
    currentProd.quantity += qty;
    productMap.set(order.productId, currentProd);
  }

  const uniqueSessionsCount = uniqueSessions.size;
  const averageTicket = uniqueSessionsCount > 0 ? totalRevenue / uniqueSessionsCount : 0;

  // 3. Top 5 produtos ordenados por receita decrescente
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => {
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue;
      }
      return b.quantity - a.quantity;
    })
    .slice(0, 5);

  return {
    metrics: {
      totalRevenue,
      averageTicket,
      uniqueSessionsCount,
      totalItemsCount,
    },
    salesOverTime,
    topProducts,
  };
}

/**
 * Consulta todos os dados do painel do lojista de forma segura no backend:
 * - Pedidos agregados no período
 * - Ocupação atual do salão
 * - Últimos chamados de mesa pendentes
 */
export async function getDashboardData(
  establishmentId: string,
  rawRange?: string,
): Promise<DashboardData> {
  const { databases } = createAdminClient();
  const range: DashboardRange =
    rawRange === 'yesterday' || rawRange === '7d' ? rawRange : 'today';

  const { startDateIso, endDateIso } = getDateRangeBoundaries(range);

  // 1. Busca pedidos do período
  const ordersRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.orders,
    [
      Query.equal('establishmentId', establishmentId),
      Query.greaterThanEqual('createdAt', startDateIso),
      Query.lessThanEqual('createdAt', endDateIso),
      Query.limit(1000),
    ],
  );

  const orders = toPlainObject<OrderDocument[]>(ordersRes.documents);
  const { metrics, salesOverTime, topProducts } = aggregateOrdersMetrics(orders, range);

  // 2. Busca mesas físicas ativas para calcular ocupação ao vivo
  const tablesRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tables,
    [
      Query.equal('establishmentId', establishmentId),
      Query.limit(500),
    ],
  );

  const tables = toPlainObject<TableDocument[]>(tablesRes.documents);
  const activeTables = tables.filter((t) => t.isActive !== false);
  const occupiedTables = activeTables.filter(
    (t) => t.status === 'occupied' || t.status === 'order_placed' || t.status === 'bill_requested',
  ).length;

  const totalTables = activeTables.length;
  const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  // 3. Busca últimos chamados de serviço
  const callsRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.serviceCalls,
    [
      Query.equal('establishmentId', establishmentId),
      Query.orderDesc('$createdAt'),
      Query.limit(10),
    ],
  );

  const recentServiceCalls = toPlainObject<ServiceCallDocument[]>(callsRes.documents);
  const pendingServiceCallsCount = recentServiceCalls.filter((c) => c.status === 'pending').length;

  return {
    range,
    metrics,
    salesOverTime,
    topProducts,
    liveStatus: {
      totalTables,
      occupiedTables,
      occupancyRate,
      pendingServiceCallsCount,
    },
    recentServiceCalls,
  };
}
