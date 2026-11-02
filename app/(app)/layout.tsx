import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getSession, getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { evaluateUserAccess } from '@/lib/auth/access-gate';
import { MerchantSidebar } from '@/components/merchant-sidebar';

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await getLoggedInUser();
  const establishment = user ? await getEstablishmentByUserId(user.$id) : null;

  const decision = evaluateUserAccess({
    isAuthenticated: true,
    establishment,
    pathname: '/dashboard',
  });

  if (!decision.allowed && decision.redirectTo) {
    redirect(decision.redirectTo);
  }

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-zinc-900 flex flex-col md:flex-row overflow-x-hidden">
      {/* Sidebar Flutuante com margem e cantos arredondados (desktop) e Drawer (mobile) */}
      <MerchantSidebar
        establishmentName={establishment?.name}
        tablesCount={establishment?.tablesCount}
      />

      {/* Conteúdo Principal da Aplicação ocupando toda a largura */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
