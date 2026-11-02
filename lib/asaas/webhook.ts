import { AsaasWebhookEvent } from './types';

export function verifyWebhookToken(token?: string | null): boolean {
  const secret = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!secret || !token) return false;
  return token === secret;
}

export function parseWebhookEvent(payload: unknown): {
  event: string;
  payment?: AsaasWebhookEvent['payment'];
  isPaymentConfirmed: boolean;
  isPaymentOverdue: boolean;
  isPaymentDeleted: boolean;
} {
  const data = payload as AsaasWebhookEvent;
  const event = data?.event || '';
  const payment = data?.payment;

  const isPaymentConfirmed =
    event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED';
  const isPaymentOverdue = event === 'PAYMENT_OVERDUE';
  const isPaymentDeleted = event === 'PAYMENT_DELETED';

  return {
    event,
    payment,
    isPaymentConfirmed,
    isPaymentOverdue,
    isPaymentDeleted,
  };
}
