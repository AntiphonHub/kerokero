import { redirect } from 'next/navigation';
import { getSession, getLoggedInUser } from '@/lib/appwrite/session';
import { AppHeader } from '@/components/app-header';

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await getLoggedInUser();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <AppHeader
        initialUserEmail={user?.email}
        initialUserName={user?.name}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
