'use client';

import React, { useState } from 'react';
import { User, Loader2, ArrowRight } from 'lucide-react';
import { joinTable } from '@/actions/client';
import type { Coordinates } from '@/lib/security/geofence';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';
export { getGeolocationErrorMessage, type GeolocationErrorDetails } from './gate-location';

export function validateNickname(nickname: string): {
  isValid: boolean;
  trimmed?: string;
  error?: string;
} {
  const trimmed = nickname ? nickname.trim() : '';
  if (!trimmed || trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Informe um apelido com pelo menos 2 caracteres.',
    };
  }
  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: 'O apelido deve ter no máximo 50 caracteres.',
    };
  }
  return {
    isValid: true,
    trimmed,
  };
}

export interface GateNicknameProps {
  token: string;
  tableNumber: number;
  tableLabel?: string;
  establishmentName?: string;
  coords?: Coordinates | null;
  onJoined?: (data: {
    participantId: string;
    participantName: string;
    tableNumber: number;
    token: string;
    session?: TableSessionDocument;
  }) => void;
  onSuccess?: (data: unknown) => void;
}

export function GateNickname({
  token,
  tableNumber,
  tableLabel,
  establishmentName,
  coords,
  onJoined,
  onSuccess,
}: GateNicknameProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateNickname(nickname);
    if (!validation.isValid || !validation.trimmed) {
      setError(validation.error || 'Apelido inválido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await joinTable(token, validation.trimmed, coords);

      if (!result.success || !result.data) {
        setError(result.message || 'Não foi possível entrar na mesa. Tente novamente.');
        setIsSubmitting(false);
        return;
      }

      if (onJoined) {
        onJoined(result.data);
      }
      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar entrada na mesa.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Visual Icon Badge */}
        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-6 shadow-xs">
          <User className="size-8" />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
          Como podemos te chamar?
        </h1>

        {/* Context */}
        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
          Seu apelido identifica seus pedidos na {tableLabel || `Mesa ${tableNumber}`} de {establishmentName || 'nosso restaurante'}.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="text-left">
            <label htmlFor="client-nickname" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Seu Apelido ou Nome
            </label>
            <input
              id="client-nickname"
              type="text"
              autoFocus
              maxLength={50}
              placeholder="Ex: Carlos, Ana, Bia..."
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              className={`w-full min-h-[48px] rounded-xl border bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
              } disabled:bg-zinc-100 disabled:opacity-70`}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || nickname.trim().length < 2}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Entrando na mesa...</span>
              </>
            ) : (
              <>
                <span>Entrar na Mesa</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-zinc-400 mt-6">
          Sem necessidade de cadastro ou senha. Apenas digite seu nome para iniciar.
        </p>
      </div>
    </div>
  );
}
