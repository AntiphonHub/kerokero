import { Query } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import type { TableSessionDocument, PaymentMethodType } from './client-sessions';
import type { OrderDocument } from './orders';

export type HistoryRange = 'today' | 'yesterday' | '7d' | '30d';
export type HistoryPaymentFilter = 'all' | 'pix_asaas' | 'pos_card' | 'cash';
export type HistoryTab = 'sessions' | 'items';

export interface HistorySummary {
  totalRevenue: number;
  pixAsaasRevenue: number;
  posMachineRevenue: number;
  sessionsCount: number;
  itemsCount: number;
}

export interface HistoryItem extends OrderDocument {
  paymentMethod?: PaymentMethodType;
}

export interface HistoryFilterParams {
  range?: HistoryRange;
  paymentMethod?: HistoryPaymentFilter;
  search?: string;
  tab?: HistoryTab;
}

export interface OrdersHistoryData {
  summary: HistorySummary;
  sessions: TableSessionDocument[];
  items: HistoryItem[];
  activeFilters: {
    range: HistoryRange;
    paymentMethod: HistoryPaymentFilter;
    search: string;
    tab: HistoryTab;
  };
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

export function getHistoryDateRangeBoundaries(
  range: HistoryRange = 'today',
  referenceDate: Date = new Date(),
): { startDateIso: string; endDateIso: string; validRange: HistoryRange } {
  const validRange: HistoryRange =
    range === 'yesterday' || range === '7d' || range === '30d' ? range : 'today';

  const { dateStr } = getBrasiliaDateParts(referenceDate);

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

  // 30d
  const ref = new Date(`${dateStr}T12:00:00.000-03:00`);
  ref.setDate(ref.getDate() - 29);
  const startParts = getBrasiliaDateParts(ref);
  const start = new Date(`${startParts.dateStr}T00:00:00.000-03:00`);
  const end = new Date(`${dateStr}T23:59:59.999-03:00`);
  return { startDateIso: start.toISOString(), endDateIso: end.toISOString(), validRange };
}

export function aggregateHistoryTotals(sessions: TableSessionDocument[]): HistorySummary {
  let totalRevenue = 0;
  let pixAsaasRevenue = 0;
  let posMachineRevenue = 0;

  for (const session of sessions) {
    const total = session.totalAmount || session.paidAmount || 0;
    totalRevenue += total;

    let pix = 0;
    let pos = 0;

    if (session.pixPaidAmount !== undefined || session.posPaidAmount !== undefined) {
      pix = session.pixPaidAmount || 0;
      pos = session.posPaidAmount || 0;
      // Garante que a soma bate com total
      if (pix + pos !== total) {
        if (session.paymentMethod === 'pix_asaas') {
          pix = total;
          pos = 0;
        } else if (session.paymentMethod === 'pos_card' || session.paymentMethod === 'cash') {
          pos = total;
          pix = 0;
        } else {
          pos = Math.max(0, total - pix);
        }
      }
    } else {
      // Legado
      if (session.paymentMethod === 'pix_asaas') {
        pix = total;
        pos = 0;
      } else {
        pos = total;
        pix = 0;
      }
    }

    pixAsaasRevenue += pix;
    posMachineRevenue += pos;
  }

  return {
    totalRevenue,
    pixAsaasRevenue,
    posMachineRevenue,
    sessionsCount: sessions.length,
    itemsCount: 0,
  };
}

export function filterHistorySessions(
  sessions: TableSessionDocument[],
  filters: { paymentMethod?: HistoryPaymentFilter; search?: string },
): TableSessionDocument[] {
  const method = filters.paymentMethod || 'all';
  const search = filters.search?.trim().toLowerCase() || '';

  return sessions.filter((session) => {
    // 1. Filtro de método de pagamento
    if (method !== 'all') {
      if (method === 'pix_asaas') {
        const isPix =
          session.paymentMethod === 'pix_asaas' ||
          (session.pixPaidAmount && session.pixPaidAmount > 0);
        if (!isPix) return false;
      } else if (method === 'pos_card') {
        const isPos =
          session.paymentMethod === 'pos_card' ||
          session.paymentMethod === 'mixed' ||
          (session.posPaidAmount && session.posPaidAmount > 0);
        if (!isPos) return false;
      } else if (method === 'cash') {
        if (session.paymentMethod !== 'cash') return false;
      }
    }

    // 2. Filtro de busca textual
    if (search) {
      const matchTable = String(session.tableNumber || '').includes(search);
      const matchParticipants = (session.participants || '').toLowerCase().includes(search);
      if (!matchTable && !matchParticipants) {
        return false;
      }
    }

    return true;
  });
}

export async function getOrdersHistoryData(
  establishmentId: string,
  params: HistoryFilterParams = {},
): Promise<OrdersHistoryData> {
  const { databases } = createAdminClient();

  const range: HistoryRange =
    params.range === 'yesterday' || params.range === '7d' || params.range === '30d'
      ? params.range
      : 'today';

  const paymentMethod: HistoryPaymentFilter =
    params.paymentMethod === 'pix_asaas' ||
    params.paymentMethod === 'pos_card' ||
    params.paymentMethod === 'cash'
      ? params.paymentMethod
      : 'all';

  const search = params.search?.trim() || '';
  const tab: HistoryTab = params.tab === 'items' ? 'items' : 'sessions';

  const { startDateIso, endDateIso } = getHistoryDateRangeBoundaries(range);

  // 1. Busca sessões finalizadas (`status: 'closed'`) no período por `closedAt`
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

  const allClosedSessions = toPlainObject<TableSessionDocument[]>(sessionsRes.documents);

  // 2. Calcula resumo contábil sobre todas as sessões finalizadas do período
  const summary = aggregateHistoryTotals(allClosedSessions);

  // 3. Aplica filtros de método de pagamento e busca
  const filteredSessions = filterHistorySessions(allClosedSessions, {
    paymentMethod,
    search,
  });

  // 4. Busca pedidos vinculados às sessões fechadas
  const sessionMap = new Map<string, TableSessionDocument>();
  for (const s of allClosedSessions) {
    sessionMap.set(s.$id, s);
  }

  let items: HistoryItem[] = [];

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

    const rawOrders = toPlainObject<OrderDocument[]>(ordersRes.documents);

    // Mapeia e associa método de pagamento da sessão
    items = rawOrders
      .filter((o) => o.status !== 'cancelled' && sessionMap.has(o.sessionId))
      .map((o) => {
        const parentSession = sessionMap.get(o.sessionId);
        return {
          ...o,
          paymentMethod: parentSession?.paymentMethod || 'pos_card',
        };
      });

    // Filtra itens pelo meio de pagamento e busca
    if (paymentMethod !== 'all') {
      items = items.filter((item) => {
        if (paymentMethod === 'pix_asaas') {
          return item.paymentMethod === 'pix_asaas';
        }
        if (paymentMethod === 'pos_card') {
          return item.paymentMethod === 'pos_card' || item.paymentMethod === 'mixed';
        }
        if (paymentMethod === 'cash') {
          return item.paymentMethod === 'cash';
        }
        return true;
      });
    }

    if (search) {
      const sLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          String(item.tableNumber).includes(search) ||
          item.productName.toLowerCase().includes(sLower) ||
          (item.participantName || '').toLowerCase().includes(sLower),
      );
    }
  } catch (err) {
    console.warn('[getOrdersHistoryData] Falha ao carregar itens de pedidos:', err);
  }

  summary.itemsCount = items.length;

  return {
    summary,
    sessions: filteredSessions,
    items,
    activeFilters: {
      range,
      paymentMethod,
      search,
      tab,
    },
  };
}
