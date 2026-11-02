import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { StepLojaForm } from '@/components/onboarding/step-loja-form';

export default async function OnboardingLojaPage() {
  const user = await getLoggedInUser();
  const est = user ? await getEstablishmentByUserId(user.$id) : null;

  const initialData = est
    ? {
        name: est.name,
        legalName: est.legalName,
        cnpj: est.cnpj,
        category: est.category,
        phone: est.phone,
        postalCode: est.postalCode,
        address: est.address,
      }
    : null;

  return (
    <div className="w-full max-w-[680px]">
      <div className="flex justify-center mb-8">
        <OnboardingStepper currentStep={1} />
      </div>

      <div className="mb-7">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-[-0.03em] text-zinc-900 leading-tight mb-1.5">
          Configuração inicial do estabelecimento
        </h1>
        <p className="text-sm sm:text-[15px] text-zinc-500 font-medium">
          Informe os dados cadastrais da sua empresa para emissão de comanda e ativação.
        </p>
      </div>

      <StepLojaForm initialData={initialData} />
    </div>
  );
}
