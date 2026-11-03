'use client';

import React from 'react';
import { formatPriceCents } from '@/lib/utils/formatters';
import { PIX_MODE_DETAILS, type PixPaymentMode } from '@/lib/utils/pix';
import { Check, ArrowRight } from 'lucide-react';

export interface ReceiptViewProps {
  amountCents: number;
  mode: PixPaymentMode;
  participantName: string;
  tableNumber: number;
  tableLabel?: string;
  paidAt: string;
  onFinish?: () => void;
}

export function ReceiptView({
  amountCents,
  mode,
  participantName,
  tableNumber,
  tableLabel,
  paidAt,
  onFinish,
}: ReceiptViewProps) {
  const formattedDate = new Date(paidAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const modeDetails = PIX_MODE_DETAILS[mode] || {
    label: 'Pagamento PIX',
    description: '',
  };

  const handleFinish = () => {
    if (onFinish) {
      onFinish();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-zinc-50 p-4 sm:p-6 justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Check Icon Badge */}
        <div className="size-20 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
          <Check className="size-10 stroke-[2.5]" />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Pagamento Confirmado
          </span>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Comprovante de Quitação
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Obrigado, <span className="font-semibold text-zinc-800">{participantName}</span>! Seu
            pagamento foi liquidado com sucesso.
          </p>
        </div>

        {/* Amount Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-1">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Valor Liquidado
          </span>
          <span className="text-2xl font-bold text-amber-400 tracking-tight block">
            {formatPriceCents(amountCents)}
          </span>
          <span className="text-[11px] text-zinc-400 block">
            Liquidado via PIX Dinâmico
          </span>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/60 text-xs space-y-2.5 text-left">
          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-500">Mesa</span>
            <span className="font-bold text-zinc-900">
              {tableLabel || `Mesa ${tableNumber}`}
            </span>
          </div>

          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-500">Participante</span>
            <span className="font-semibold text-zinc-900">{participantName}</span>
          </div>

          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-500">Modalidade</span>
            <span className="font-semibold text-zinc-900">{modeDetails.label}</span>
          </div>

          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-500">Data e Hora</span>
            <span className="font-medium text-zinc-800">{formattedDate}</span>
          </div>

          <div className="pt-2 border-t border-zinc-200/80 flex justify-between items-center">
            <span className="text-zinc-500">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/70 text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Quitado Integralmente
            </span>
          </div>
        </div>

        {/* Next step notice */}
        <p className="text-[11px] text-zinc-400 leading-relaxed px-2">
          Sua comanda individual foi encerrada. Para iniciar um novo consumo nesta mesa, basta
          escanear o QR Code novamente.
        </p>

        {/* Finish / Restart CTA */}
        <button
          type="button"
          onClick={handleFinish}
          className="w-full min-h-[48px] px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-xs"
        >
          <span>Finalizar</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
