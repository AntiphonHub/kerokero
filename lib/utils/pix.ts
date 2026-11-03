import type { OrderDocument } from '@/lib/appwrite/orders';
import type {
  TableSessionDocument,
  SessionParticipant,
} from '@/lib/appwrite/client-sessions';

export type PixPaymentMode = 'my_items' | 'split' | 'total';

export interface PixAmounts {
  myItemsCents: number;
  splitCents: number;
  totalCents: number;
  remainingTableBalance: number;
  unpaidCount: number;
  myAlreadyPaidCents: number;
}

function parseParticipants(participantsRaw: unknown): SessionParticipant[] {
  if (Array.isArray(participantsRaw)) {
    return participantsRaw;
  }
  if (typeof participantsRaw === 'string') {
    try {
      const parsed = JSON.parse(participantsRaw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Calcula valores em centavos para cada modalidade de pagamento PIX.
 */
export function calculatePixAmounts(params: {
  orders: OrderDocument[];
  session: TableSessionDocument | null;
  currentParticipantId: string;
}): PixAmounts {
  const { orders, session, currentParticipantId } = params;

  const totalAmount = session?.totalAmount || 0;
  const paidAmount = session?.paidAmount || 0;
  const remainingTableBalance = Math.max(0, totalAmount - paidAmount);

  // Meus Itens: apenas pedidos ativos do participante atual
  const myOrders = (orders || []).filter(
    (o) => o.participantId === currentParticipantId && o.status !== 'cancelled',
  );
  const myTotalCents = myOrders.reduce(
    (acc, o) => acc + (o.totalPrice ?? o.unitPrice * o.quantity),
    0,
  );

  const participants: SessionParticipant[] = session
    ? parseParticipants(session.participants)
    : [];

  const currentParticipant = participants.find((p) => p.id === currentParticipantId);
  const myAlreadyPaidCents = currentParticipant?.paidAmount || 0;
  const myRemaining = Math.max(0, myTotalCents - myAlreadyPaidCents);

  const myItemsCents = Math.min(myRemaining, remainingTableBalance);

  // Dividir igualmente: divide o saldo restante pelos participantes não quitados
  const unpaidCount = participants.filter((p) => !p.isPaid).length || 1;
  const splitCents = Math.min(
    Math.ceil(remainingTableBalance / unpaidCount),
    remainingTableBalance,
  );

  // Conta total: quita todo o saldo restante da mesa
  const totalCents = remainingTableBalance;

  return {
    myItemsCents,
    splitCents,
    totalCents,
    remainingTableBalance,
    unpaidCount,
    myAlreadyPaidCents,
  };
}

/**
 * Formata contagem regressiva em MM:SS.
 */
export function formatPixCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const PIX_MODE_DETAILS: Record<
  PixPaymentMode,
  { label: string; description: string }
> = {
  my_items: {
    label: 'Pagar Meus Itens',
    description: 'Apenas os produtos consumidos por você',
  },
  split: {
    label: 'Dividir Igualmente',
    description: 'Divisão em partes iguais entre participantes pendentes',
  },
  total: {
    label: 'Pagar Conta Total',
    description: 'Quitação integral de todo o saldo em aberto da mesa',
  },
};
