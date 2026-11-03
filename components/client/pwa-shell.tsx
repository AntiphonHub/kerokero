import React from 'react';
import { User, Store } from 'lucide-react';

export interface PwaShellProps {
  tableLabel?: string;
  establishmentName?: string;
  participantName?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PwaShell({
  tableLabel,
  establishmentName,
  participantName,
  headerRight,
  children,
  className = '',
}: PwaShellProps) {
  return (
    <div className={`flex flex-col flex-1 min-h-dvh bg-zinc-50 ${className}`}>
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-bold tracking-tight text-white shadow-xs">
            KK
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            {establishmentName && (
              <span className="truncate text-[11px] font-medium tracking-wide uppercase text-zinc-500">
                {establishmentName}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-zinc-900">
              {tableLabel || 'Comanda Digital'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {participantName ? (
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200/60 px-3 py-1 text-xs font-medium text-zinc-800">
              <User className="size-3.5 text-zinc-500 shrink-0" />
              <span className="max-w-[110px] truncate">{participantName}</span>
            </div>
          ) : (
            headerRight || null
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">{children}</main>
    </div>
  );
}
