'use client';

import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/brand';

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
    <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <Brand />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          Painel Lojista
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-zinc-900 leading-tight">{displayName}</p>
          {displayEmail && (
            <p className="text-xs text-zinc-500 font-mono leading-tight">{displayEmail}</p>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="h-9 px-4 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
