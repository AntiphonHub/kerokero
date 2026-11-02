import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';

export default async function OnboardingIndexPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const est = await getEstablishmentByUserId(user.$id);
  if (!est) {
    redirect('/onboarding/loja');
  }

  if (est.onboardingCompleted) {
    if (est.subscriptionStatus === 'active') {
      redirect('/dashboard');
    }
    redirect('/onboarding/conclusao');
  }

  switch (est.onboardingStep) {
    case 1:
      redirect('/onboarding/loja');
    case 2:
      redirect('/onboarding/operacao');
    case 3:
      redirect('/onboarding/subconta');
    case 4:
    default:
      redirect('/onboarding/conclusao');
  }
}
