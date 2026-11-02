import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookToken, parseWebhookEvent } from '@/lib/asaas/webhook';
import { updateSubscriptionStatus } from '@/lib/appwrite/establishments';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('asaas-access-token');

    if (!verifyWebhookToken(token)) {
      console.warn('[Webhook Asaas] Tentativa de acesso não autorizada - token inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event, payment, isPaymentConfirmed, isPaymentOverdue, isPaymentDeleted } =
      parseWebhookEvent(payload);

    const subscriptionId = payment?.subscription;

    if (subscriptionId) {
      if (isPaymentConfirmed) {
        console.log(`[Webhook Asaas] Pagamento confirmado para assinatura: ${subscriptionId}`);
        await updateSubscriptionStatus(subscriptionId, 'active');
      } else if (isPaymentOverdue) {
        console.log(`[Webhook Asaas] Pagamento vencido para assinatura: ${subscriptionId}`);
        await updateSubscriptionStatus(subscriptionId, 'overdue');
      } else if (isPaymentDeleted) {
        console.log(`[Webhook Asaas] Pagamento cancelado para assinatura: ${subscriptionId}`);
        await updateSubscriptionStatus(subscriptionId, 'canceled');
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Webhook Asaas] Erro ao processar webhook:', msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
