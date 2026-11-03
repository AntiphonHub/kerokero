import type { OrderDocument, OrderStatus } from '@/lib/appwrite/orders';
import type { TableSessionDocument, SessionParticipant } from '@/lib/appwrite/client-sessions';

export interface ParticipantGroup {
  participantId: string;
  participantName: string;
  orders: OrderDocument[];
  totalCents: number;
  isPaid?: boolean;
  paidAmount?: number;
}

export interface TableSummary {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  activeOrdersCount: number;
}

export interface OrderStatusInfo {
  status: OrderStatus;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

/**
 * Filtra pedidos realizados por um participante específico.
 */
export function filterParticipantOrders(
  orders: OrderDocument[],
  participantId: string,
): OrderDocument[] {
  if (!Array.isArray(orders)) return [];
  return orders.filter((o) => o.participantId === participantId);
}

/**
 * Calcula o total em centavos dos pedidos ativos (não cancelados) de um participante.
 */
export function calculateParticipantTotal(
  orders: OrderDocument[],
  participantId: string,
): number {
  const userOrders = filterParticipantOrders(orders, participantId);
  return userOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalPrice ?? o.unitPrice * o.quantity), 0);
}

/**
 * Agrupa os pedidos por participante para exibição consolidada da mesa.
 */
export function groupOrdersByParticipant(
  orders: OrderDocument[],
  knownParticipants: SessionParticipant[] = [],
): ParticipantGroup[] {
  const groupsMap = new Map<string, ParticipantGroup>();

  // 1. Inicializa grupos com participantes conhecidos da sessão
  for (const p of knownParticipants) {
    groupsMap.set(p.id, {
      participantId: p.id,
      participantName: p.name,
      orders: [],
      totalCents: 0,
      isPaid: p.isPaid,
      paidAmount: p.paidAmount,
    });
  }

  // 2. Agrupa os pedidos existentes
  if (Array.isArray(orders)) {
    for (const order of orders) {
      const pid = order.participantId;
      if (!groupsMap.has(pid)) {
        groupsMap.set(pid, {
          participantId: pid,
          participantName: order.participantName || 'Cliente',
          orders: [],
          totalCents: 0,
          isPaid: false,
          paidAmount: 0,
        });
      }

      const group = groupsMap.get(pid)!;
      group.orders.push(order);
      if (order.status !== 'cancelled') {
        group.totalCents += order.totalPrice ?? order.unitPrice * order.quantity;
      }
    }
  }

  return Array.from(groupsMap.values());
}

/**
 * Calcula o resumo consolidado financeiro da mesa.
 */
export function calculateTableSummary(
  session: TableSessionDocument | null,
  orders: OrderDocument[],
): TableSummary {
  const activeOrders = Array.isArray(orders)
    ? orders.filter((o) => o.status !== 'cancelled')
    : [];

  const ordersTotal = activeOrders.reduce(
    (sum, o) => sum + (o.totalPrice ?? o.unitPrice * o.quantity),
    0,
  );

  const totalAmount = session && session.totalAmount > 0 ? session.totalAmount : ordersTotal;
  const paidAmount = session ? (session.paidAmount || 0) : 0;
  const remainingBalance = Math.max(0, totalAmount - paidAmount);
  const isFullyPaid = totalAmount > 0 && remainingBalance <= 0;

  return {
    totalAmount,
    paidAmount,
    remainingBalance,
    isFullyPaid,
    activeOrdersCount: activeOrders.length,
  };
}

/**
 * Retorna as informações visuais e textuais do status do pedido.
 */
export function getOrderStatusInfo(status: OrderStatus): OrderStatusInfo {
  switch (status) {
    case 'pending':
      return {
        status,
        label: 'Recebido',
        colorClass: 'text-amber-800',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200/80',
      };
    case 'preparing':
      return {
        status,
        label: 'Em preparo',
        colorClass: 'text-blue-800',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200/80',
      };
    case 'ready':
      return {
        status,
        label: 'Pronto',
        colorClass: 'text-emerald-800',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200/80',
      };
    case 'delivered':
      return {
        status,
        label: 'Entregue',
        colorClass: 'text-zinc-700',
        bgClass: 'bg-zinc-100',
        borderClass: 'border-zinc-200',
      };
    case 'cancelled':
      return {
        status,
        label: 'Cancelado',
        colorClass: 'text-red-700',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200/80',
      };
    default:
      return {
        status,
        label: 'Desconhecido',
        colorClass: 'text-zinc-600',
        bgClass: 'bg-zinc-100',
        borderClass: 'border-zinc-200',
      };
  }
}

/**
 * Formata opções customizadas selecionadas para exibição amigável.
 */
export function formatSelectedOptionsSummary(selectedOptions: unknown): string {
  if (!selectedOptions) return '';

  if (typeof selectedOptions === 'string') {
    try {
      const parsed = JSON.parse(selectedOptions);
      return formatSelectedOptionsSummary(parsed);
    } catch {
      return selectedOptions.trim();
    }
  }

  if (Array.isArray(selectedOptions)) {
    return selectedOptions
      .map((opt) => {
        if (typeof opt === 'string') return opt;
        if (opt && typeof opt === 'object') {
          const item = opt as Record<string, unknown>;
          return item.name || item.label || JSON.stringify(item);
        }
        return String(opt);
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof selectedOptions === 'object') {
    return Object.entries(selectedOptions as Record<string, unknown>)
      .map(([key, val]) => `${key}: ${String(val)}`)
      .join(', ');
  }

  return String(selectedOptions);
}
