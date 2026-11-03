export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: process.env.APPWRITE_DATABASE_ID || 'kerokero',
  collections: {
    profiles: process.env.APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
    establishments: process.env.APPWRITE_ESTABLISHMENTS_COLLECTION_ID || 'establishments',
    products: process.env.APPWRITE_PRODUCTS_COLLECTION_ID || 'products',
    categories: process.env.APPWRITE_CATEGORIES_COLLECTION_ID || 'categories',
    tables: process.env.APPWRITE_TABLES_COLLECTION_ID || 'tables',
    tableSessions: process.env.APPWRITE_TABLE_SESSIONS_COLLECTION_ID || 'table_sessions',
    serviceCalls: process.env.APPWRITE_SERVICE_CALLS_COLLECTION_ID || 'service_calls',
    orders: process.env.APPWRITE_ORDERS_COLLECTION_ID || 'orders',
  },
} as const;
