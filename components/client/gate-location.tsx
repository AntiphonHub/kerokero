'use client';

import React, { useState } from 'react';
import { MapPin, AlertCircle, Loader2, Compass, ShieldCheck } from 'lucide-react';
import { validateClientLocation } from '@/actions/client';
import type { Coordinates } from '@/lib/security/geofence';

export interface GeolocationErrorDetails {
  title: string;
  description: string;
  instructions: {
    ios: string;
    android: string;
  };
}

export function getGeolocationErrorMessage(error: { code: number }): GeolocationErrorDetails {
  if (error.code === 1) {
    // PERMISSION_DENIED
    return {
      title: 'Permissão de localização negada',
      description: 'Para abrir sua comanda na mesa, precisamos validar que você está no estabelecimento.',
      instructions: {
        ios: 'No Safari: toque em "aA" na barra de endereços > Ajustes do Site > Localização > Permitir.',
        android: 'No Chrome: toque no cadeado ou nos 3 pontos > Permissões > Localização > Permitir.',
      },
    };
  }

  if (error.code === 2) {
    // POSITION_UNAVAILABLE
    return {
      title: 'Sinal de GPS indisponível',
      description: 'Não foi possível obter sua localização. Verifique se o GPS do seu dispositivo está ativado.',
      instructions: {
        ios: 'Ajustes > Privacidade e Segurança > Serviços de Localização > Ativar.',
        android: 'Deslize o painel superior e ative o botão de Localização/GPS.',
      },
    };
  }

  // TIMEOUT (3) or others
  return {
    title: 'Tempo limite esgotado',
    description: 'A obtenção de localização demorou além do esperado. Tente novamente.',
    instructions: {
      ios: 'Certifique-se de estar conectado à internet e toque em Tentar Novamente.',
      android: 'Certifique-se de estar conectado à internet e toque em Tentar Novamente.',
    },
  };
}

export interface GateLocationProps {
  token: string;
  tableNumber: number;
  tableLabel?: string;
  establishmentName?: string;
  onLocationValidated?: (coords: Coordinates | null) => void;
  onSuccess?: (coords: Coordinates | null) => void;
}

export function GateLocation({
  token,
  tableNumber,
  tableLabel,
  establishmentName,
  onLocationValidated,
  onSuccess,
}: GateLocationProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'validating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<GeolocationErrorDetails | null>(null);

  const handleNotifySuccess = (coords: Coordinates | null) => {
    if (onLocationValidated) onLocationValidated(coords);
    if (onSuccess) onSuccess(coords);
  };

  const requestLocation = () => {
    setErrorMessage(null);
    setErrorDetails(null);

    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setStatus('error');
      setErrorMessage('Seu navegador não possui suporte a geolocalização.');
      return;
    }

    setStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('validating');
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const result = await validateClientLocation(token, coords);
        if (result.success) {
          handleNotifySuccess(coords);
        } else {
          setStatus('error');
          setErrorMessage(result.message || 'Você precisa estar no estabelecimento para acessar a mesa.');
        }
      },
      (error) => {
        setStatus('error');
        const details = getGeolocationErrorMessage(error);
        setErrorDetails(details);
        setErrorMessage(details.description);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Visual Icon Badge */}
        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-6 shadow-xs">
          {status === 'requesting' || status === 'validating' ? (
            <Loader2 className="size-8 animate-spin" />
          ) : status === 'error' ? (
            <AlertCircle className="size-8 text-red-600" />
          ) : (
            <MapPin className="size-8" />
          )}
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
          {status === 'requesting'
            ? 'Obtendo localização...'
            : status === 'validating'
              ? 'Validando presença na mesa...'
              : status === 'error'
                ? errorDetails?.title || 'Localização não confirmada'
                : 'Confirmar Presença na Mesa'}
        </h1>

        {/* Subtitle / Context */}
        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
          {status === 'requesting' || status === 'validating'
            ? 'Aguarde um instante enquanto validamos sua presença no estabelecimento.'
            : status === 'error'
              ? errorMessage
              : `Você está na ${tableLabel || `Mesa ${tableNumber}`} de ${establishmentName || 'nosso estabelecimento'}. Confirme sua localização para abrir o cardápio e fazer pedidos.`}
        </p>

        {/* Troubleshooting Instructions for Permissions */}
        {errorDetails && (
          <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left mb-6 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Compass className="size-3.5" />
              Como ativar a localização
            </div>
            <div className="text-xs text-zinc-700 space-y-2">
              <div>
                <strong className="text-zinc-900 font-medium">iPhone (Safari):</strong>
                <p className="text-zinc-600 mt-0.5">{errorDetails.instructions.ios}</p>
              </div>
              <div className="border-t border-zinc-200/60 pt-2">
                <strong className="text-zinc-900 font-medium">Android (Chrome):</strong>
                <p className="text-zinc-600 mt-0.5">{errorDetails.instructions.android}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button (Min 44px touch target) */}
        <button
          type="button"
          onClick={requestLocation}
          disabled={status === 'requesting' || status === 'validating'}
          className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xs"
        >
          {status === 'requesting' || status === 'validating' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verificando...</span>
            </>
          ) : status === 'error' ? (
            <span>Tentar Novamente</span>
          ) : (
            <>
              <ShieldCheck className="size-4 text-amber-400" />
              <span>Confirmar Localização</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-zinc-400 mt-4">
          Acesso restrito ao raio de 250m do estabelecimento para prevenção de pedidos indevidos.
        </p>
      </div>
    </div>
  );
}
