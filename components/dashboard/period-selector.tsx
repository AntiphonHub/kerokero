'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { DashboardRange } from '@/lib/appwrite/dashboard';

interface PeriodSelectorProps {
  currentRange: DashboardRange;
}

const periods: Array<{ id: DashboardRange; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: '7d', label: 'Últimos 7 dias' },
];

export function PeriodSelector({ currentRange }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (range: DashboardRange) => {
    if (range === currentRange) return;

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (range === 'today') {
        params.delete('range');
      } else {
        params.set('range', range);
      }

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  return (
    <div className="inline-flex items-center rounded-xl bg-zinc-200/70 p-1 border border-zinc-200 shadow-2xs">
      {periods.map((period) => {
        const isActive = currentRange === period.id;
        return (
          <button
            key={period.id}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(period.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              isActive
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
            } ${isPending ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
