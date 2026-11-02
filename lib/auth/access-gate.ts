import { EstablishmentDocument } from '@/lib/appwrite/establishments';

export interface EvaluateAccessParams {
  isAuthenticated: boolean;
  establishment: EstablishmentDocument | null;
  pathname: string;
}

export interface AccessDecision {
  allowed: boolean;
  redirectTo: string | null;
}

export function evaluateUserAccess(params: EvaluateAccessParams): AccessDecision {
  const { isAuthenticated, establishment, pathname } = params;

  // 1. Não autenticado -> sempre login
  if (!isAuthenticated) {
    if (pathname.startsWith('/login') || pathname.startsWith('/cadastro')) {
      return { allowed: true, redirectTo: null };
    }
    return { allowed: false, redirectTo: '/login' };
  }

  // 2. Autenticado tentando acessar páginas de auth (/login, /cadastro)
  if (pathname.startsWith('/login') || pathname.startsWith('/cadastro')) {
    if (!establishment) {
      return { allowed: false, redirectTo: '/onboarding/loja' };
    }
    if (!establishment.onboardingCompleted) {
      return { allowed: false, redirectTo: getStepRoute(establishment.onboardingStep) };
    }
    if (establishment.subscriptionStatus !== 'active') {
      return { allowed: false, redirectTo: '/onboarding/conclusao' };
    }
    return { allowed: false, redirectTo: '/dashboard' };
  }

  // 3. Autenticado mas ainda não cadastrou o estabelecimento
  if (!establishment) {
    if (pathname === '/onboarding/loja') {
      return { allowed: true, redirectTo: null };
    }
    return { allowed: false, redirectTo: '/onboarding/loja' };
  }

  // 4. Onboarding em andamento (incompleto)
  if (!establishment.onboardingCompleted) {
    const targetRoute = getStepRoute(establishment.onboardingStep);
    if (pathname === targetRoute) {
      return { allowed: true, redirectTo: null };
    }
    return { allowed: false, redirectTo: targetRoute };
  }

  // 5. Onboarding concluído mas assinatura inativa (Sem planos gratuitos)
  if (establishment.subscriptionStatus !== 'active') {
    if (pathname === '/onboarding/conclusao') {
      return { allowed: true, redirectTo: null };
    }
    return { allowed: false, redirectTo: '/onboarding/conclusao' };
  }

  // 6. Estabelecimento configurado e assinatura ativa
  // Se estiver tentando voltar pro onboarding após ativo, manda pro dashboard
  if (pathname.startsWith('/onboarding') && pathname !== '/onboarding/conclusao') {
    return { allowed: false, redirectTo: '/dashboard' };
  }

  return { allowed: true, redirectTo: null };
}

function getStepRoute(step: number): string {
  switch (step) {
    case 1:
      return '/onboarding/loja';
    case 2:
      return '/onboarding/operacao';
    case 3:
      return '/onboarding/subconta';
    case 4:
    default:
      return '/onboarding/conclusao';
  }
}
