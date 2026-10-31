import 'server-only';
import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { appwriteConfig } from './config';

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
