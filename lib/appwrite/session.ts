import 'server-only';
import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { appwriteConfig } from './config';
import { createSessionClient } from './server';

const helpers = appwriteConfig.endpoint && appwriteConfig.projectId
  ? createNextServerHelpers({
      endpoint: appwriteConfig.endpoint,
      projectId: appwriteConfig.projectId,
    })
  : null;

export async function getSession(): Promise<string | null> {
  if (!helpers) return null;
  try {
    const session = await helpers.readSessionCookie();
    return session ?? null;
  } catch {
    return null;
  }
}

export async function getLoggedInUser() {
  if (!helpers) return null;
  try {
    return await helpers.getLoggedInUser();
  } catch {
    return null;
  }
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
