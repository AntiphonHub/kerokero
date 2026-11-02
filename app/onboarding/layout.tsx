import { redirect } from 'next/navigation';
import { getSession, getLoggedInUser } from '@/lib/appwrite/session';
import { Brand } from '@/components/brand';

export default async function OnboardingLayout({
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
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <header className="h-[72px] px-6 md:px-12 flex items-center justify-between border-b border-zinc-100 flex-shrink-0">
        <Brand />
        {user?.email && (
          <div className="text-xs md:text-[13.5px] text-zinc-500 font-medium">
            {user.email}
          </div>
        )}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-12">
        {children}
      </main>
    </div>
  );
}
