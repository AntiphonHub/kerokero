import { Query } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import type { TableSessionDocument } from './client-sessions';
import { parseSessionParticipants } from '@/lib/utils/tab';
import type { OrderDocument } from './orders';

export type AnalyticsRange = 'today' | 'yesterday' | '7d' | '30d' | 'this_month';

export interface AnalyticsKPIs {
  totalRevenue: number;
  pixAsaasRevenue: number;
  posMachineRevenue: number;
  pixPercentage: number;
  posPercentage: number;
  totalSessions: number;
  totalCustomers: number;
  averageTicketPerTable: number;
  averageTicketPerCustomer: number;
  averageStayMinutes: number;
  formattedStayDuration: string;
}

export interface ChannelSalesPoint {
  label: string;
  pixRevenue: number;
  posRevenue: number;
  totalRevenue: number;
}

export interface CategoryMetric {
  categoryName: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

export interface TopProductAnalytics {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  kpis: AnalyticsKPIs;
  channelSalesOverTime: ChannelSalesPoint[];
  categoryDistribution: CategoryMetric[];
  topProducts: TopProductAnalytics[];
}

function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function getBrasiliaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.format(date);
  const [year, month, day] = parts.split('-').map(Number);
  return { year, month, day, dateStr: parts };
}

export function formatStayDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${mins} min`;
}

export function getAnalyticsDateRangeBoundaries(
  range: AnalyticsRange = 'today',
  referenceDate: Date = new Date(),
): { startDateIso: string; endDateIso: string; validRange: AnalyticsRange } {
  const validRange: AnalyticsRange =
    range === 'yesterday' || range === '7d' || range === '30d' || range === 'this_month'
      ? range
      : 'today';

  const { dateStr, year, month } = getBrasiliaDateParts(referenceDate);

  if (validRange === 'today') {
    const start = new Date(`${dateStr}T00:00:00.000-03:00`);
    const end = new Date(`${dateStr}T23:59:59.999-03:00`);
    return { startDateIso: start.toISOString(), endDateIso: end.toISOString(), validRange };
  }

  if (validRange === 'yesterday') {
    const ref = new Date(`${dateStr}T12:00:00.000-03:00`);
    ref.setDate(ref.getDate() - 1);
    const yParts = getBrasiliaDateParts(ref);
    const start = new Date(`${yParts.dateStr}T00:00:00.000-03:00`);
    const end = new Date(`${yParts.dateStr}T23:59:59.999-03:00`);
    return { startDateIso: start.toISOString(), endDateIso: end.toISOString(), validRange };
  }

  if (validRange === '7d') {
    const ref = new Date(`${dateStr}T12:00:00.000-03:00`);
    ref.setDate(ref.getDate() - 6);
    const startParts = getBrasiliaDateParts(ref);
    const start = new Date(`${startParts.dateStr}T00:00:00.000-03:00`);
    const end = new Date(`${dateStr}T23:59:59.999-03:00`);
    return { startDateIso: start.toISOString(), endDateIso: end.toISOString(), validRange };
  }

  if (validRange === '30d') {
    const ref = new Date(`${dateStr}T12:00:00.000-03:00`);
    ref.setDate(ref.getDate() - 29);
    const startParts = getBrasiliaDateParts(ref);
    const start = new Date(`${startParts.dateStr}T00:00:00.000-03:00`);
    const end = new Date(`${dateStr}T23:59:59.999-03:00`);
    return { startDateIso: start.toISOString(), endDateIso: end.toISOString(), validRange };
  }

  // this_month: Dia 1 do mês corrente às 00:00 até hoje às 23:59
  const monthStr = String(month).padStart(2, '0');
  const start = new Date(`${year}-${monthStr}-01T00:00:00.000-03:00`);
  const end = new Date(`${dateStr}T23:59:59.999-03:00`);
  return { startDateIso: start.toISOString(), endDateIso: end.toISOString(), validRange };
}

export function aggregateAnalyticsMetrics(
  sessions: TableSessionDocument[],
  orders: OrderDocument[],
  range: AnalyticsRange = 'today',
  referenceDate: Date = new Date(),
  productCategoryMap: Map<string, string> = new Map(),
): {
  kpis: AnalyticsKPIs;
  channelSalesOverTime: ChannelSalesPoint[];
  categoryDistribution: CategoryMetric[];
  topProducts: TopProductAnalytics[];
} {
  let totalRevenue = 0;
  let pixAsaasRevenue = 0;
  let posMachineRevenue = 0;
  let totalCustomers = 0;
  let totalStayMs = 0;
  let validStaySessionsCount = 0;

  // 1. Processa cada comanda finalizada
  for (const session of sessions) {
    const sessionTotal = session.totalAmount || session.paidAmount || 0;
    totalRevenue += sessionTotal;

    let pix = 0;
    let pos = 0;

    if (session.pixPaidAmount !== undefined || session.posPaidAmount !== undefined) {
      pix = session.pixPaidAmount || 0;
      pos = session.posPaidAmount || 0;
      if (pix + pos !== sessionTotal) {
        if (session.paymentMethod === 'pix_asaas') {
          pix = sessionTotal;
          pos = 0;
        } else if (session.paymentMethod === 'pos_card' || session.paymentMethod === 'cash') {
          pos = sessionTotal;
          pix = 0;
        } else {
          pos = Math.max(0, sessionTotal - pix);
        }
      }
    } else {
      if (session.paymentMethod === 'pix_asaas') {
        pix = sessionTotal;
        pos = 0;
      } else {
        pos = sessionTotal;
        pix = 0;
      }
    }

    pixAsaasRevenue += pix;
    posMachineRevenue += pos;

    const participants = parseSessionParticipants(session.participants);
    totalCustomers += Math.max(1, participants.length);

    // Duração da mesa (permanência)
    if (session.openedAt && session.closedAt) {
      const startMs = new Date(session.openedAt).getTime();
      const endMs = new Date(session.closedAt).getTime();
      const diffMs = endMs - startMs;
      // Válido se entre 1 minuto e 12 horas
      if (diffMs > 0 && diffMs <= 12 * 60 * 60 * 1000) {
        totalStayMs += diffMs;
        validStaySessionsCount += 1;
      }
    }
  }

  const totalSessions = sessions.length;
  const pixPercentage = totalRevenue > 0 ? Math.round((pixAsaasRevenue / totalRevenue) * 100) : 0;
  const posPercentage = totalRevenue > 0 ? 100 - pixPercentage : 0;
  const averageTicketPerTable = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;
  const averageTicketPerCustomer = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  const averageStayMinutes =
    validStaySessionsCount > 0
      ? Math.round(totalStayMs / validStaySessionsCount / (1000 * 60))
      : 0;

  const formattedStayDuration = formatStayDuration(averageStayMinutes);

  // 2. Série temporal por canal de pagamento
  let channelSalesOverTime: ChannelSalesPoint[] = [];

  if (range === 'today' || range === 'yesterday') {
    // 24 horas
    channelSalesOverTime = Array.from({ length: 24 }, (_, i) => ({
      label: `${String(i).padStart(2, '0')}h`,
      pixRevenue: 0,
      posRevenue: 0,
      totalRevenue: 0,
    }));

    for (const session of sessions) {
      const closedDate = new Date(session.closedAt || session.$createdAt);
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false,
      }).format(closedDate);
      const hour = parseInt(hourStr, 10);

      if (hour >= 0 && hour < 24) {
        const pix = session.pixPaidAmount || (session.paymentMethod === 'pix_asaas' ? (session.totalAmount || 0) : 0);
        const total = session.totalAmount || session.paidAmount || 0;
        const pos = Math.max(0, total - pix);

        channelSalesOverTime[hour].pixRevenue += pix;
        channelSalesOverTime[hour].posRevenue += pos;
        channelSalesOverTime[hour].totalRevenue += total;
      }
    }
  } else {
    // Dias
    const numDays = range === '7d' ? 7 : range === '30d' ? 30 : 31;
    const { dateStr } = getBrasiliaDateParts(referenceDate);
    const baseDate = new Date(`${dateStr}T12:00:00.000-03:00`);
    const dayMap = new Map<string, ChannelSalesPoint>();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const parts = getBrasiliaDateParts(d);
      const label = `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}`;
      dayMap.set(parts.dateStr, { label, pixRevenue: 0, posRevenue: 0, totalRevenue: 0 });
    }

    for (const session of sessions) {
      const closedDate = new Date(session.closedAt || session.$createdAt);
      const parts = getBrasiliaDateParts(closedDate);
      const slot = dayMap.get(parts.dateStr);

      if (slot) {
        const pix = session.pixPaidAmount || (session.paymentMethod === 'pix_asaas' ? (session.totalAmount || 0) : 0);
        const total = session.totalAmount || session.paidAmount || 0;
        const pos = Math.max(0, total - pix);

        slot.pixRevenue += pix;
        slot.posRevenue += pos;
        slot.totalRevenue += total;
      }
    }

    channelSalesOverTime = Array.from(dayMap.values());
  }

  // 3. Distribuição por Categoria e Top Produtos
  const categoryMap = new Map<string, { revenue: number; quantity: number }>();
  const productMap = new Map<string, { productId: string; productName: string; revenue: number; quantity: number }>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const price = order.totalPrice ?? (order.unitPrice || 0) * (order.quantity || 1);
    const qty = order.quantity || 1;

    // Categoria
    const catName = productCategoryMap.get(order.productId) || 'Cardápio Principal';
    const cat = categoryMap.get(catName) || { revenue: 0, quantity: 0 };
    cat.revenue += price;
    cat.quantity += qty;
    categoryMap.set(catName, cat);

    // Produto
    const prod = productMap.get(order.productId) || {
      productId: order.productId,
      productName: order.productName || 'Item',
      revenue: 0,
      quantity: 0,
    };
    prod.revenue += price;
    prod.quantity += qty;
    productMap.set(order.productId, prod);
  }

  const categoryDistribution: CategoryMetric[] = Array.from(categoryMap.entries())
    .map(([categoryName, data]) => ({
      categoryName,
      revenue: data.revenue,
      quantity: data.quantity,
      percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProducts: TopProductAnalytics[] = Array.from(productMap.values())
    .sort((a, b) => (b.revenue !== a.revenue ? b.revenue - a.revenue : b.quantity - a.quantity))
    .slice(0, 5);

  return {
    kpis: {
      totalRevenue,
      pixAsaasRevenue,
      posMachineRevenue,
      pixPercentage,
      posPercentage,
      totalSessions,
      totalCustomers,
      averageTicketPerTable,
      averageTicketPerCustomer,
      averageStayMinutes,
      formattedStayDuration,
    },
    channelSalesOverTime,
    categoryDistribution,
    topProducts,
  };
}

export async function getAnalyticsData(
  establishmentId: string,
  rawRange?: string,
): Promise<AnalyticsData> {
  const { databases } = createAdminClient();

  const range: AnalyticsRange =
    rawRange === 'yesterday' ||
    rawRange === '7d' ||
    rawRange === '30d' ||
    rawRange === 'this_month'
      ? rawRange
      : 'today';

  const { startDateIso, endDateIso } = getAnalyticsDateRangeBoundaries(range);

  // 1. Busca comandas finalizadas no período
  const sessionsRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.tableSessions,
    [
      Query.equal('establishmentId', establishmentId),
      Query.equal('status', 'closed'),
      Query.greaterThanEqual('closedAt', startDateIso),
      Query.lessThanEqual('closedAt', endDateIso),
      Query.orderDesc('closedAt'),
      Query.limit(500),
    ],
  );

  const sessions = toPlainObject<TableSessionDocument[]>(sessionsRes.documents);
  const sessionIds = new Set(sessions.map((s) => s.$id));

  // 2. Busca produtos para mapear categorias
  const productCategoryMap = new Map<string, string>();
  try {
    const productsRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.products,
      [Query.equal('establishmentId', establishmentId), Query.limit(500)],
    );
    for (const p of productsRes.documents) {
      if (p.categoryName) {
        productCategoryMap.set(p.$id, String(p.categoryName));
      }
    }
  } catch (err) {
    console.warn('[getAnalyticsData] Falha ao consultar produtos:', err);
  }

  // 3. Busca pedidos associados às sessões
  let orders: OrderDocument[] = [];
  try {
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
    const allOrders = toPlainObject<OrderDocument[]>(ordersRes.documents);
    orders = allOrders.filter((o) => sessionIds.has(o.sessionId));
  } catch (err) {
    console.warn('[getAnalyticsData] Falha ao consultar pedidos:', err);
  }

  const { kpis, channelSalesOverTime, categoryDistribution, topProducts } =
    aggregateAnalyticsMetrics(sessions, orders, range, new Date(), productCategoryMap);

  return {
    range,
    kpis,
    channelSalesOverTime,
    categoryDistribution,
    topProducts,
  };
}
