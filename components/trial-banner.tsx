'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';

interface TrialBannerProps {
  trialEndsAt?: string;
}

export function TrialBanner({ trialEndsAt }: TrialBannerProps) {
  if (!trialEndsAt) return null;

  const diffMs = Date.parse(trialEndsAt) - Date.now();
  if (diffMs <= 0) return null;

  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="mb-4 sm:mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-950">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium">
          Período de teste gratuito: você tem{' '}
          <strong className="font-bold text-amber-900">
            {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
          </strong>
          .
        </span>
      </div>

      <Link
        href="/settings?tab=subscription"
        className="inline-flex items-center justify-center self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] sm:text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
      >
        Ativar assinatura definitiva
      </Link>
    </div>
  );
}

