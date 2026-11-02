'use client';

import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  initialUserEmail?: string;
  initialUserName?: string;
}

export function AppHeader({ initialUserEmail, initialUserName }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const displayName = user?.name || initialUserName || user?.email || initialUserEmail || 'Lojista';
  const displayEmail = user?.email || initialUserEmail || '';

  const handleSignOut = () => {
    signOut.signOut({
      onSuccess: () => {
        router.push('/login');
        router.refresh();
      },
    });
  };

  return (
    <header className="h-16 mx-3 mt-3 px-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
          Painel Lojista
        </span>
        <span className="text-xs text-zinc-600 hidden sm:inline">
          Operação em tempo real
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-zinc-900 leading-tight">{displayName}</p>
          {displayEmail && (
            <p className="text-[11px] text-zinc-600 font-mono leading-tight">{displayEmail}</p>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="h-8 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer active:scale-95 shadow-2xs"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
