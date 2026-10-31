'use client';

import { AppwriteProvider } from '@appwrite.io/react';

export function Providers({
    session,
    children
}: {
    session?: string | null;
    children: React.ReactNode;
}) {
    return (
        <AppwriteProvider
            endpoint={process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'}
            projectId={process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'placeholder'}
            ssr={{ session, basePath: '/api/appwrite' }}
        >
            {children}
        </AppwriteProvider>
    );
}
