export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: process.env.APPWRITE_DATABASE_ID || 'kerokero',
  collections: {
    profiles: process.env.APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
  },
} as const;
