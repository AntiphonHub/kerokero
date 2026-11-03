'use client';

import React, { useState } from 'react';
import { Bell, CreditCard, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { callWaiterAction } from '@/actions/client';
import type { ServiceCallDocument } from '@/lib/appwrite/tables';

export interface ServiceButtonsProps {
  className?: string;
  onServiceCalled?: (callDoc?: ServiceCallDocument) => void;
  variant?: 'full' | 'bell-round';
}

const WAITER_PRESETS = [
  'Gelo / Copo',
  'Talher / Prato',
  'Limpar mesa',
  'Dúvida no pedido',
  'Pedir maquininha',
  'Outro',
] as const;

const CARD_PRESETS = ['Crédito', 'Débito', 'Refeição / VR'] as const;

export function ServiceButtons({
  className = '',
  onServiceCalled,
  variant = 'bell-round',
}: ServiceButtonsProps) {
  const [modalType, setModalType] = useState<'waiter' | 'card' | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const handleOpenWaiterModal = () => {
    setSelectedPreset(WAITER_PRESETS[0]);
    setCustomReason('');
    setModalType('waiter');
  };

  const handleOpenCardModal = () => {
    setSelectedPreset(CARD_PRESETS[0]);
    setCustomReason('');
    setModalType('card');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setModalType(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    let reason: string = selectedPreset;
    let type: 'waiter' | 'bill_card' = modalType === 'card' ? 'bill_card' : 'waiter';

    if (modalType === 'waiter' && selectedPreset === 'Outro') {
      reason = customReason.trim() || 'Outro motivo';
    } else if (modalType === 'waiter' && selectedPreset === 'Pedir maquininha') {
      type = 'bill_card';
      reason = 'Maquininha na mesa';
    } else if (modalType === 'card') {
      reason = `Maquininha: ${selectedPreset}`;
    }

    setIsSubmitting(true);
    try {
      const res = await callWaiterAction(reason, type);

      if (res.success) {
        setModalType(null);
        setFeedback({
          type: 'success',
          message:
            modalType === 'card'
              ? 'Solicitação de maquininha enviada ao garçom.'
              : 'Garçom chamado com sucesso! Um atendente já vem até sua mesa.',
        });
        onServiceCalled?.(res.data);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Falha ao solicitar atendimento.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro de conexão ao chamar serviço.',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    }
  };

  return (
    <>
      {/* Quick Action Trigger */}
      {variant === 'bell-round' ? (
        <button
          type="button"
          onClick={handleOpenWaiterModal}
          aria-label="Chamar Garçom"
          className={`size-11 rounded-full border border-zinc-200/90 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-amber-600 hover:border-amber-300 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-xs ${className}`}
        >
          <Bell className="size-5 text-amber-500" />
        </button>
      ) : (
        <div className={`flex items-center gap-2 ${className}`}>
          <button
            type="button"
            onClick={handleOpenWaiterModal}
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-white border border-zinc-200/90 text-zinc-800 text-xs font-semibold shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Bell className="size-4 text-amber-500 shrink-0" />
            <span>Chamar Garçom</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCardModal}
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-white border border-zinc-200/90 text-zinc-800 text-xs font-semibold shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <CreditCard className="size-4 text-zinc-700 shrink-0" />
            <span>Pedir Maquininha</span>
          </button>
        </div>
      )}

      {/* Floating Feedback Notification */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-16 left-4 right-4 z-50 p-3.5 rounded-2xl shadow-lg border text-xs font-medium flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 ${
            feedback.type === 'success'
              ? 'bg-zinc-900 text-white border-zinc-800'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-red-500 shrink-0" />
            )}
            <p className="leading-snug">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar mensagem"
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Bottom Sheet Modal for Chamar Garçom / Pedir Maquininha */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-xl border-t border-zinc-200 animate-in slide-in-from-bottom duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-dialog-title"
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  {modalType === 'waiter' ? (
                    <Bell className="size-4" />
                  ) : (
                    <CreditCard className="size-4" />
                  )}
                </div>
                <h3
                  id="service-dialog-title"
                  className="text-sm font-bold text-zinc-900 tracking-tight"
                >
                  {modalType === 'waiter' ? 'Chamar Garçom' : 'Pedir Maquininha na Mesa'}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Fechar"
                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-500 flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Presets Selection */}
            <div className="py-4 space-y-3">
              <p className="text-xs text-zinc-500">
                {modalType === 'waiter'
                  ? 'Selecione o motivo para que a equipe te atenda rapidamente:'
                  : 'Qual modalidade de pagamento na maquininha?'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {modalType === 'waiter'
                  ? WAITER_PRESETS.map((preset) => {
                      const isSelected = selectedPreset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSelectedPreset(preset)}
                          className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100'
                          }`}
                        >
                          <span>{preset}</span>
                          {isSelected && <span className="size-1.5 rounded-full bg-amber-400" />}
                        </button>
                      );
                    })
                  : CARD_PRESETS.map((preset) => {
                      const isSelected = selectedPreset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSelectedPreset(preset)}
                          className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100'
                          }`}
                        >
                          <span>{preset}</span>
                          {isSelected && <span className="size-1.5 rounded-full bg-amber-400" />}
                        </button>
                      );
                    })}
              </div>

              {/* Custom input when "Outro" selected */}
              {modalType === 'waiter' && selectedPreset === 'Outro' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva brevemente o motivo..."
                    maxLength={120}
                    className="w-full h-11 px-3 text-xs rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-zinc-400" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Confirmar Chamado</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
