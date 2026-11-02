import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { StepOperacaoForm } from '@/components/onboarding/step-operacao-form';

export default async function OnboardingOperacaoPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const est = await getEstablishmentByUserId(user.$id);
  if (!est) {
    redirect('/onboarding/loja');
  }

  const initialData = {
    tablesCount: est.tablesCount,
    orderMode: est.orderMode,
    openingDays: est.openingDays,
    openingTime: est.openingTime,
    closingTime: est.closingTime,
  };

  return (
    <div className="w-full max-w-[700px]">
      <div className="flex justify-center mb-8">
        <OnboardingStepper currentStep={2} />
      </div>

      <div className="mb-7">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-[-0.03em] text-zinc-900 leading-tight mb-1.5">
          Operação e estrutura das mesas
        </h1>
        <p className="text-sm sm:text-[15px] text-zinc-500 font-medium">
          Defina a quantidade de mesas e o fluxo de envio dos pedidos para a cozinha.
        </p>
      </div>

      <StepOperacaoForm initialData={initialData} />
    </div>
  );
}
