import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { StepSubcontaForm } from '@/components/onboarding/step-subconta-form';

export default async function OnboardingSubcontaPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const est = await getEstablishmentByUserId(user.$id);
  if (!est) {
    redirect('/onboarding/loja');
  }

  const initialData = {
    repName: est.repName,
    repCpf: est.repCpf,
    repBirthDate: est.repBirthDate,
    bankCode: est.bankCode,
    bankPixKey: est.bankPixKey,
    bankAgency: est.bankAgency,
    bankAccount: est.bankAccount,
    cnpj: est.cnpj,
  };

  return (
    <div className="w-full max-w-[960px]">
      <div className="flex justify-center mb-8">
        <OnboardingStepper currentStep={3} />
      </div>

      <div className="mb-7">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-[-0.03em] text-zinc-900 leading-tight mb-1.5">
          Abertura de subconta de recebimento
        </h1>
        <p className="text-sm sm:text-[15px] text-zinc-500 font-medium">
          Dados bancários e documentação para repasse de PIX e fechamento de comandas.
        </p>
      </div>

      <StepSubcontaForm initialData={initialData} />
    </div>
  );
}
