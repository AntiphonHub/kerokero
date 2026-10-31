import { createAppwriteHandlers } from '@appwrite.io/react/handlers/next';

export const { GET, POST } = createAppwriteHandlers({
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'placeholder',
    apiKey: process.env.APPWRITE_API_KEY || 'placeholder',
    basePath: '/api/appwrite'
});
