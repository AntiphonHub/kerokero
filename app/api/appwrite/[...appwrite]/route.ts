import { createAppwriteHandlers } from '@appwrite.io/react/handlers/next';

const isProduction = process.env.NODE_ENV === 'production';
// 1 ano (365 dias) de permanência para o cookie de sessão do lojista
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const { GET, POST } = createAppwriteHandlers({
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'placeholder',
  apiKey: process.env.APPWRITE_API_KEY || 'placeholder',
  basePath: '/api/appwrite',
  cookieOptions: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: ONE_YEAR_IN_SECONDS,
  },
});
