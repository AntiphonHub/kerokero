import { asaasRequest } from './client';
import {
  AsaasSubscription,
  AsaasSubscriptionInput,
  AsaasPixQrCode,
} from './types';

export async function createAsaasSubscription(
  input: AsaasSubscriptionInput,
): Promise<AsaasSubscription> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split('T')[0];

  return asaasRequest<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customerId,
      billingType: 'PIX',
      value: input.value,
      nextDueDate: input.nextDueDate || formattedDate,
      cycle: input.cycle || 'MONTHLY',
      description: input.description || 'Assinatura KeroKero',
    }),
  });
}

export async function getAsaasSubscriptionPix(
  subscriptionId: string,
): Promise<AsaasPixQrCode> {
  // 1. Busca os pagamentos da assinatura (tenta até 3 vezes com intervalo caso o Asaas esteja gerando assincronamente)
  let payment: { id: string } | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    const paymentsResponse = await asaasRequest<{
      data: Array<{ id: string; status?: string }>;
    }>(`/payments?subscription=${subscriptionId}`);

    payment = paymentsResponse.data?.[0];
    if (payment) break;

    if (attempt < 2) {
      await new Promise((res) => setTimeout(res, 1200));
    }
  }

  if (!payment) {
    throw new Error('Nenhum pagamento encontrado para a assinatura');
  }

  // 2. Busca o QR Code PIX daquele pagamento
  return asaasRequest<AsaasPixQrCode>(`/payments/${payment.id}/pixQrCode`);
}

export async function getAsaasSubscriptionPayments(
  subscriptionId: string,
): Promise<Array<{ id: string; status: string; value: number }>> {
  const res = await asaasRequest<{
    data: Array<{ id: string; status: string; value: number }>;
  }>(`/payments?subscription=${subscriptionId}`);
  return res.data || [];
}
