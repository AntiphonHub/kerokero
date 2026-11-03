'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { OrderDocument } from '@/lib/appwrite/orders';
import type { TableSessionDocument } from '@/lib/appwrite/client-sessions';
import { requestPixCheckoutAction, pollPixStatusAction } from '@/actions/client';
import { isValidCpf, formatCpf } from '@/lib/validators/cpf';
import { formatPriceCents } from '@/lib/utils/formatters';
import {
  calculatePixAmounts,
  formatPixCountdown,
  PIX_MODE_DETAILS,
  type PixPaymentMode,
} from '@/lib/utils/pix';
import {
  X,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Receipt,
  Users,
  CreditCard,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderDocument[];
  session: TableSessionDocument | null;
  currentParticipantId: string;
  currentParticipantName: string;
  tableNumber: number;
  initialMode?: PixPaymentMode;
  onPaymentComplete: (data: {
    amountCents: number;
    mode: PixPaymentMode;
    paymentId: string;
    paidAt: string;
  }) => void;
}

interface PixChargeData {
  paymentId: string;
  pixQrCodeBase64: string;
  pixCopyPaste: string;
  expirationDate: string;
  amountCents: number;
  value: number;
  mode: string;
}

export function PixModal({
  isOpen,
  onClose,
  orders,
  session,
  currentParticipantId,
  currentParticipantName,
  tableNumber,
  initialMode = 'my_items',
  onPaymentComplete,
}: PixModalProps) {
  const [step, setStep] = useState<'mode_select' | 'cpf_input' | 'qr_code'>('mode_select');
  const [selectedMode, setSelectedMode] = useState<PixPaymentMode>(initialMode);
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 minutos

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Recalcula valores da mesa e do participante
  const amounts = calculatePixAmounts({
    orders,
    session,
    currentParticipantId,
  });

  // Limpa timers ao fechar ou desmontar
  const clearAllTimers = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      setStep('mode_select');
      setSelectedMode(initialMode);
      setCpf('');
      setCpfError(null);
      setErrorMessage(null);
      setPixData(null);
      setCopied(false);
      setSecondsLeft(900);
    } else {
      setSelectedMode(initialMode);
      // Se a modalidade inicial tiver saldo <= 0, busca uma com saldo
      if (initialMode === 'my_items' && amounts.myItemsCents <= 0) {
        if (amounts.remainingTableBalance > 0) {
          setSelectedMode('total');
        }
      }
    }
    return () => clearAllTimers();
  }, [isOpen, initialMode, amounts.myItemsCents, amounts.remainingTableBalance]);

  // Efeito de contagem regressiva e polling quando na tela de QR Code
  useEffect(() => {
    if (step !== 'qr_code' || !pixData) {
      clearAllTimers();
      return;
    }

    // 1. Timer de 15 minutos (900s)
    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Loop de polling a cada 3000ms
    const checkStatus = async () => {
      try {
        const res = await pollPixStatusAction(pixData.paymentId, pixData.amountCents);
        if (res.success && res.data?.isPaid) {
          clearAllTimers();
          onPaymentComplete({
            amountCents: pixData.amountCents,
            mode: selectedMode,
            paymentId: pixData.paymentId,
            paidAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('[PixModal] Erro ao consultar status do PIX:', err);
      }
    };

    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => clearAllTimers();
  }, [step, pixData, selectedMode, onPaymentComplete]);

  if (!isOpen) return null;

  // Valor a pagar conforme a modalidade selecionada
  const targetAmountCents =
    selectedMode === 'my_items'
      ? amounts.myItemsCents
      : selectedMode === 'split'
        ? amounts.splitCents
        : amounts.totalCents;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
    if (cpfError) setCpfError(null);
    if (errorMessage) setErrorMessage(null);
  };

  const handleGeneratePix = async () => {
    const rawCpf = cpf.replace(/\D/g, '');
    if (!isValidCpf(rawCpf)) {
      setCpfError('Digite um CPF válido com 11 dígitos.');
      return;
    }

    if (targetAmountCents <= 0) {
      setErrorMessage('O valor para pagamento nesta modalidade é R$ 0,00.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await requestPixCheckoutAction(selectedMode, rawCpf);
      if (!res.success || !res.data) {
        setErrorMessage(res.message || 'Falha ao emitir cobrança PIX. Tente novamente.');
        setIsGenerating(false);
        return;
      }

      setPixData(res.data);
      setSecondsLeft(900);
      setStep('qr_code');
    } catch (err) {
      console.error('[PixModal] Erro ao solicitar PIX:', err);
      setErrorMessage('Erro de conexão ao gerar o PIX. Verifique sua internet.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pixData?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(pixData.pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback simples se navigator.clipboard falhar
      const textarea = document.createElement('textarea');
      textarea.value = pixData.pixCopyPaste;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getModeIcon = (mode: PixPaymentMode) => {
    switch (mode) {
      case 'my_items':
        return <Receipt className="size-4" />;
      case 'split':
        return <Users className="size-4" />;
      case 'total':
        return <CreditCard className="size-4" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pix-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-zinc-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60">
          <div className="flex items-center gap-2">
            {step === 'cpf_input' && (
              <button
                type="button"
                onClick={() => setStep('mode_select')}
                className="size-8 rounded-lg hover:bg-zinc-200/80 text-zinc-600 flex items-center justify-center transition-colors"
                aria-label="Voltar para seleção de modalidade"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                Mesa {tableNumber} • Checkout
              </span>
              <h2 id="pix-modal-title" className="text-base font-bold text-zinc-900 tracking-tight">
                {step === 'mode_select' && 'Pagar com PIX'}
                {step === 'cpf_input' && 'Identificação do Pagador'}
                {step === 'qr_code' && 'Aguardando Pagamento'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="size-8 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* STEP 1: SELEÇÃO DA MODALIDADE */}
          {step === 'mode_select' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600">
                Selecione como prefere pagar sua conta agora. O valor será creditado
                instantaneamente para o restaurante.
              </p>

              <div className="space-y-2.5">
                {(['my_items', 'split', 'total'] as PixPaymentMode[]).map((mode) => {
                  const isSelected = selectedMode === mode;
                  const details = PIX_MODE_DETAILS[mode];
                  const amount =
                    mode === 'my_items'
                      ? amounts.myItemsCents
                      : mode === 'split'
                        ? amounts.splitCents
                        : amounts.totalCents;
                  const isZero = amount <= 0;

                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={isZero}
                      onClick={() => setSelectedMode(mode)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 min-h-[56px] ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/30 ring-1 ring-amber-500 shadow-2xs'
                          : isZero
                            ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'
                            : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 font-bold'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {getModeIcon(mode)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 block leading-tight">
                            {details.label}
                          </span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5 leading-snug">
                            {mode === 'split'
                              ? `${details.description} (${amounts.unpaidCount} pessoa${
                                  amounts.unpaidCount > 1 ? 's' : ''
                                })`
                              : details.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isZero ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Quitado
                          </span>
                        ) : (
                          <span
                            className={`text-sm font-bold block ${
                              isSelected ? 'text-amber-600' : 'text-zinc-900'
                            }`}
                          >
                            {formatPriceCents(amount)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={targetAmountCents <= 0}
                  onClick={() => setStep('cpf_input')}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-xs"
                >
                  <span>Continuar para Pagamento ({formatPriceCents(targetAmountCents)})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DIGITAÇÃO DO CPF */}
          {step === 'cpf_input' && (
            <div className="space-y-4">
              {/* Resumo da Opção Escolhida */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Modalidade
                  </span>
                  <span className="text-xs font-bold text-zinc-900">
                    {PIX_MODE_DETAILS[selectedMode].label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Valor a Pagar
                  </span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatPriceCents(targetAmountCents)}
                  </span>
                </div>
              </div>

              {/* Informação sobre exigência do CPF */}
              <div className="space-y-1.5">
                <label
                  htmlFor="payer-cpf-input"
                  className="text-xs font-bold text-zinc-800 block"
                >
                  CPF do Titular da Conta PIX
                </label>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  O Banco Central e o gateway de pagamento exigem o CPF para emissão da chave
                  PIX nominal em tempo real.
                </p>

                <input
                  id="payer-cpf-input"
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full min-h-[48px] px-3.5 text-sm rounded-xl border bg-white text-zinc-900 transition-colors focus:outline-none focus:ring-2 ${
                    cpfError
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-zinc-300 focus:border-zinc-900 focus:ring-zinc-200'
                  }`}
                />

                {cpfError && (
                  <p className="text-[11px] font-medium text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{cpfError}</span>
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('mode_select')}
                  disabled={isGenerating}
                  className="min-h-[48px] px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Alterar Modo</span>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePix}
                  disabled={isGenerating || !cpf}
                  className="min-h-[48px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Gerando PIX...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="size-4" />
                      <span>Gerar PIX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: EXIBIÇÃO DO QR CODE E POLLING */}
          {step === 'qr_code' && pixData && (
            <div className="space-y-4 text-center">
              {/* Valor e Timer */}
              <div className="p-3 rounded-2xl bg-zinc-900 text-white space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Valor a Pagar
                </span>
                <span className="text-xl font-bold text-amber-400 block tracking-tight">
                  {formatPriceCents(pixData.amountCents)}
                </span>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 bg-zinc-800/80 px-2.5 py-0.5 rounded-full mt-1">
                  <Clock className="size-3 text-amber-400" />
                  <span>
                    {secondsLeft > 0
                      ? `Expira em ${formatPixCountdown(secondsLeft)}`
                      : 'Código expirado'}
                  </span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col items-center justify-center">
                {pixData.pixQrCodeBase64 ? (
                  <img
                    src={
                      pixData.pixQrCodeBase64.startsWith('data:')
                        ? pixData.pixQrCodeBase64
                        : `data:image/png;base64,${pixData.pixQrCodeBase64}`
                    }
                    alt="QR Code PIX para pagamento"
                    className="size-48 rounded-xl border border-zinc-200 bg-white p-2 object-contain shadow-2xs"
                  />
                ) : (
                  <div className="size-48 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-400">
                    <QrCode className="size-16" />
                  </div>
                )}

                <p className="text-[11px] text-zinc-500 mt-2">
                  Aponte a câmera do aplicativo do seu banco para o QR Code acima
                </p>
              </div>

              {/* Botão Copia e Cola */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`w-full min-h-[48px] px-4 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-white" />
                      <span>Código PIX Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copiar Código PIX</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Polling Status Indicator */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center gap-2 text-xs text-amber-900">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                <span className="font-medium">
                  Aguardando confirmação do banco...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
