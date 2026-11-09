import { EstablishmentDocument } from '@/lib/appwrite/establishments';

export interface EvaluateAccessParams {
  isAuthenticated: boolean;
  establishment: EstablishmentDocument | null;
  pathname: string;
  now?: number;
}

export interface AccessDecision {
  allowed: boolean;
  redirectTo: string | null;
}

/**
 * Determina se o estabelecimento tem permissão de operação completa.
 * Retorna true se a assinatura estiver ativa ('active') ou se o período de teste ('trialing') estiver vigente.
 */
export function isEstablishmentAccessible(
  establishment: EstablishmentDocument,
  now: number = Date.now(),
): boolean {
  if (establishment.subscriptionStatus === 'active') {
    return true;
  }
  if (establishment.subscriptionStatus === 'trialing') {
    if (!establishment.trialEndsAt) {
      return true;
    }
    return Date.parse(establishment.trialEndsAt) > now;
  }
  return false;
}

export function evaluateUserAccess(params: EvaluateAccessParams): AccessDecision {
  const { isAuthenticated, establishment, pathname, now = Date.now() } = params;

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
    if (!isEstablishmentAccessible(establishment, now)) {
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

  // 5. Onboarding concluído mas assinatura inativa / trial expirado
  const accessible = isEstablishmentAccessible(establishment, now);
  if (!accessible) {
    // A rota de Carteira & Saques (/wallet) é expressamente liberada para o lojista
    // nunca ter seu saldo financeiro de vendas retido ou congelado.
    if (pathname.startsWith('/wallet')) {
      return { allowed: true, redirectTo: null };
    }
    if (pathname === '/onboarding/conclusao') {
      return { allowed: true, redirectTo: null };
    }
    return { allowed: false, redirectTo: '/onboarding/conclusao' };
  }

  // 6. Estabelecimento configurado e assinatura / trial ativo
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
