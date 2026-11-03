'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GateLocation } from './gate-location';
import { GateNickname } from './gate-nickname';
import type { Coordinates } from '@/lib/security/geofence';
import { CheckCircle2, Loader2 } from 'lucide-react';

export interface GateFlowProps {
  token: string;
  tableNumber: number;
  tableLabel?: string;
  establishmentName?: string;
}

export function GateFlow({
  token,
  tableNumber,
  tableLabel,
  establishmentName,
}: GateFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<'location' | 'nickname' | 'joined'>('location');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [joinedParticipant, setJoinedParticipant] = useState<{
    participantName: string;
    participantId: string;
  } | null>(null);

  const handleLocationValidated = (validatedCoords: Coordinates | null) => {
    setCoords(validatedCoords);
    setStep('nickname');
  };

  const handleJoined = (data: {
    participantId: string;
    participantName: string;
    tableNumber: number;
  }) => {
    setJoinedParticipant(data);
    setStep('joined');
    // Refresh the page so the Server Component picks up the newly set HTTP-only cookie
    setTimeout(() => {
      router.refresh();
    }, 600);
  };

  if (step === 'location') {
    return (
      <GateLocation
        token={token}
        tableNumber={tableNumber}
        tableLabel={tableLabel}
        establishmentName={establishmentName}
        onLocationValidated={handleLocationValidated}
      />
    );
  }

  if (step === 'nickname') {
    return (
      <GateNickname
        token={token}
        tableNumber={tableNumber}
        tableLabel={tableLabel}
        establishmentName={establishmentName}
        coords={coords}
        onJoined={handleJoined}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
          Entrada Confirmada!
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
          Bem-vindo(a), <span className="font-semibold text-zinc-900">{joinedParticipant?.participantName}</span>. Conectando você à comanda da {tableLabel || `Mesa ${tableNumber}`}...
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="size-4 animate-spin text-amber-500" />
          <span>Abrindo a comanda da mesa...</span>
        </div>
      </div>
    </div>
  );
}
