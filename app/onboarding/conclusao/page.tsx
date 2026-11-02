import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import {
  getEstablishmentByUserId,
  updateSubscriptionStatus,
} from '@/lib/appwrite/establishments';
import {
  getAsaasSubscriptionPix,
  getAsaasSubscriptionPayments,
} from '@/lib/asaas/subscriptions';
import { StepConclusaoBox } from '@/components/onboarding/step-conclusao-box';

export default async function OnboardingConclusaoPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const est = await getEstablishmentByUserId(user.$id);
  if (!est) {
    redirect('/onboarding/loja');
  }

  // Se já estiver ativa, vai direto para o dashboard
  if (est.subscriptionStatus === 'active') {
    redirect('/dashboard');
  }

  // Conciliação ativa com o Asaas caso o webhook ainda não tenha processado
  if (est.asaasSubscriptionId) {
    try {
      const payments = await getAsaasSubscriptionPayments(est.asaasSubscriptionId);
      const isPaid = payments.some(
        (p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED',
      );
      if (isPaid) {
        await updateSubscriptionStatus(est.asaasSubscriptionId, 'active');
        redirect('/dashboard');
      }
    } catch (err) {
      console.warn('[Onboarding Conclusao] Erro na conciliação Asaas:', err);
    }
  }

  let pixQrCodeImage: string | null = null;
  let pixCopiaECola: string | null = null;

  // Se a assinatura estiver pendente e existir ID no Asaas, carrega o PIX
  if (est.asaasSubscriptionId) {
    try {
      const pixData = await getAsaasSubscriptionPix(est.asaasSubscriptionId);
      pixQrCodeImage = pixData.encodedImage;
      pixCopiaECola = pixData.payload;
    } catch (pixErr) {
      console.warn('[Onboarding Conclusao] Erro ao carregar PIX da assinatura:', pixErr);
    }
  }

  return (
    <StepConclusaoBox
      establishmentName={est.name}
      tablesCount={est.tablesCount || 15}
      orderMode={est.orderMode || 'direct'}
      subaccountStatus={est.subaccountStatus || 'under_analysis'}
      initialSubscriptionStatus={est.subscriptionStatus || 'pending'}
      pixQrCodeImage={pixQrCodeImage}
      pixCopiaECola={pixCopiaECola}
    />
  );
}
