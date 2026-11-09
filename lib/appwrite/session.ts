import 'server-only';
import { cookies } from 'next/headers';
import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { appwriteConfig } from './config';
import { createSessionClient } from './server';

const helpers = appwriteConfig.endpoint && appwriteConfig.projectId
  ? createNextServerHelpers({
      endpoint: appwriteConfig.endpoint,
      projectId: appwriteConfig.projectId,
    })
  : null;

function isDynamicUsageError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'digest' in err) {
    const digest = (err as { digest: string }).digest;
    return typeof digest === 'string' && digest.startsWith('DYNAMIC_SERVER_USAGE');
  }
  return false;
}

export async function getSession(): Promise<string | null> {
  // 1. Tenta pelo helper oficial do @appwrite.io/react
  if (helpers) {
    try {
      const session = await helpers.readSessionCookie();
      if (session) return session;
    } catch (err) {
      if (isDynamicUsageError(err)) throw err;
    }
  }

  // 2. Fallback direto inspecionando cookies (cobre variações de nomenclatura de sessão Appwrite)
  try {
    const cookieStore = await cookies();
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || appwriteConfig.projectId;

    if (projectId) {
      const candidate =
        cookieStore.get(`appwrite-session-${projectId}`)?.value ||
        cookieStore.get(`a_session_${projectId}`)?.value ||
        cookieStore.get(`a_session_${projectId}_legacy`)?.value;
      if (candidate) return candidate;
    }

    // Busca qualquer cookie ativo que comece com appwrite-session- ou a_session_
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith('appwrite-session-') || c.name.startsWith('a_session_')) {
        if (c.value) return c.value;
      }
    }
  } catch (err) {
    if (isDynamicUsageError(err)) throw err;
  }

  return null;
}

export async function getLoggedInUser() {
  if (helpers) {
    try {
      const user = await helpers.getLoggedInUser();
      if (user) return user;
    } catch (err) {
      if (isDynamicUsageError(err)) throw err;
    }
  }

  // Fallback se helpers falhou mas temos o segredo de sessão pelo cookie
  const session = await getSession();
  if (session) {
    try {
      const { account } = createSessionClient(session);
      return await account.get();
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Estende/renova a sessão atual no Appwrite Server.
 * Útil para manter a sessão ativa sem exigir novo login do usuário.
 */
export async function extendSession(sessionSecret: string) {
  try {
    const { account } = createSessionClient(sessionSecret);
    return await account.updateSession({ sessionId: 'current' });
  } catch {
    return null;
  }
}
