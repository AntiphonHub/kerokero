'use client';

import { getEstablishmentInitials, formatTablesCount } from '@/lib/utils/sidebar';
import { SidebarTooltip } from './sidebar-tooltip';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface SidebarFooterProps {
  establishmentName?: string | null;
  tablesCount?: number | null;
  isCollapsed: boolean;
}

export function SidebarFooter({
  establishmentName,
  tablesCount,
  isCollapsed,
}: SidebarFooterProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut.signOut({
      onSuccess: () => {
        router.push('/login');
        router.refresh();
      },
    });
  };

  const name = establishmentName || 'Bempedi';
  const initials = getEstablishmentInitials(name);
  const formattedTables = formatTablesCount(tablesCount);

  const initialsBadge = (
    <div
      data-testid="establishment-initials"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200/80 font-bold text-xs tracking-wider text-zinc-800 transition-transform active:scale-95 shadow-2xs"
    >
      {initials}
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="mt-auto border-t border-zinc-100 pt-3 flex flex-col items-center gap-2">
        <SidebarTooltip
          content={name}
          subContent={formattedTables}
          disabled={!isCollapsed}
        >
          {initialsBadge}
        </SidebarTooltip>

        <SidebarTooltip content="Sair da conta" disabled={!isCollapsed}>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sair da conta"
            className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </SidebarTooltip>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t border-zinc-100 pt-3 flex items-center justify-between">
      <div className="flex items-center gap-3 p-1 rounded-xl min-w-0 flex-1 select-none">
        {initialsBadge}

        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 truncate leading-tight">
            {name}
          </p>
          <p className="text-xs text-zinc-500 font-normal leading-tight mt-0.5">
            {formattedTables}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        title="Sair da conta"
        aria-label="Sair da conta"
        className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
