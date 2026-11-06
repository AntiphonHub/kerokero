'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { AnalyticsRange } from '@/lib/appwrite/analytics';

interface AnalyticsFiltersProps {
  currentRange: AnalyticsRange;
}

const ranges: Array<{ id: AnalyticsRange; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'this_month', label: 'Este Mês' },
];

export function AnalyticsFilters({ currentRange }: AnalyticsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (range: AnalyticsRange) => {
    if (range === currentRange) return;

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (range === 'today') {
        params.delete('range');
      } else {
        params.set('range', range);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <div className="inline-flex items-center rounded-xl bg-zinc-200/70 p-1 border border-zinc-200 shadow-2xs overflow-x-auto">
      {ranges.map((r) => {
        const isActive = currentRange === r.id;
        return (
          <button
            key={r.id}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(r.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer shrink-0 ${
              isActive
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
            } ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
