import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getSession } from '@/lib/appwrite/session';
import { Brand } from '@/components/brand';
import { AuthShowcase } from '@/components/auth/auth-showcase';

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-center py-8 lg:py-12">
      {/* Main Split Content */}
      <main className="max-w-[1280px] w-full mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-8 lg:gap-14 items-center">
          {/* Form column with Brand */}
          <div className="w-full max-w-[420px] mx-auto lg:mx-0 flex flex-col">
            <div className="mb-6 lg:mb-8">
              <Brand />
            </div>
            {children}
          </div>

          {/* Showcase column */}
          <div className="w-full">
            <AuthShowcase />
          </div>
        </div>
      </main>
    </div>
  );
}
