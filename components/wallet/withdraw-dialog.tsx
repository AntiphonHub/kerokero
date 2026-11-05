'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowUpRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { requestWithdrawalAction } from '@/actions/wallet';

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  bankPixKey?: string;
  repName?: string;
  establishmentName?: string;
  onSuccess: () => void;
}

const PIX_TYPES: { type: PixKeyType; label: string; placeholder: string }[] = [
  { type: 'CPF', label: 'CPF', placeholder: '000.000.000-00' },
  { type: 'CNPJ', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { type: 'EMAIL', label: 'E-mail', placeholder: 'exemplo@empresa.com' },
  { type: 'PHONE', label: 'Celular', placeholder: '+5511999999999' },
  { type: 'EVP', label: 'Aleatória', placeholder: 'Chave aleatória (UUID)' },
];

function inferPixKeyType(key: string): PixKeyType {
  const clean = key.trim();
  if (!clean) return 'CPF';
  if (clean.includes('@')) return 'EMAIL';
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 14) return 'CNPJ';
  if (digits.length === 11) return 'CPF';
  if (clean.startsWith('+') || (digits.length >= 10 && digits.length <= 13)) return 'PHONE';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) return 'EVP';
  return 'CPF';
}

export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance,
  bankPixKey,
  repName,
  establishmentName,
  onSuccess,
}: WithdrawDialogProps) {
  const [amountStr, setAmountStr] = useState('');
  const [pixKey, setPixKey] = useState(bankPixKey || '');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(inferPixKeyType(bankPixKey || ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincroniza e autopreenche quando o diálogo abre ou a chave cadastrada muda
  useEffect(() => {
    if (open) {
      const defaultKey = bankPixKey || '';
      setPixKey(defaultKey);
      setPixKeyType(inferPixKeyType(defaultKey));
      setAmountStr('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, bankPixKey]);

  const numericAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  const isExceedingBalance = numericAmount > availableBalance;
  const isInvalidAmount = numericAmount <= 0;
  const isMissingPixKey = !pixKey.trim();

  const handleQuickSelect = (value: number) => {
    const clamped = Math.min(value, availableBalance);
    setAmountStr(clamped.toFixed(2).replace('.', ','));
    setErrorMessage(null);
  };

  const handleWithdrawAll = () => {
    setAmountStr(availableBalance.toFixed(2).replace('.', ','));
    setErrorMessage(null);
  };

  const currentPlaceholder =
    PIX_TYPES.find((t) => t.type === pixKeyType)?.placeholder || 'Chave PIX';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isMissingPixKey) {
      setErrorMessage('Informe a chave Pix de destino para receber o saque.');
      return;
    }

    if (isInvalidAmount) {
      setErrorMessage('Informe um valor de saque válido maior que zero.');
      return;
    }

    if (isExceedingBalance) {
      setErrorMessage('O valor solicitado excede o saldo disponível.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await requestWithdrawalAction(numericAmount, {
        pixAddressKey: pixKey.trim(),
        pixAddressKeyType: pixKeyType,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Falha ao realizar saque.');
        return;
      }

      setSuccessMessage('Saque PIX enviado com sucesso para a conta informada!');
      onSuccess();

      setTimeout(() => {
        setSuccessMessage(null);
        setAmountStr('');
        onOpenChange(false);
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Erro inesperado ao solicitar saque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-amber-500" />
            Solicitar Saque via PIX
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4 pt-2">
          {/* Resumo do Saldo Disponível */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Saldo Disponível:</span>
            <span className="text-base font-bold text-zinc-900 font-mono">
              R$ {availableBalance.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Configuração da Chave Pix de Destino */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 tracking-wider uppercase flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                  Conta de Destino
                </label>
                {(repName || establishmentName) && (
                  <span className="text-xs text-zinc-500 truncate max-w-[170px]">
                    {repName || establishmentName}
                  </span>
                )}
              </div>

              {/* Seletor de Tipo da Chave Pix */}
              <div className="grid grid-cols-5 gap-1 pt-0.5">
                {PIX_TYPES.map((item) => {
                  const isSelected = pixKeyType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setPixKeyType(item.type);
                        setErrorMessage(null);
                      }}
                      disabled={isSubmitting}
                      className={`py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                        isSelected
                          ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/70'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input da Chave Pix */}
            <div className="space-y-1">
              <label htmlFor="pix-key-input" className="text-xs text-zinc-500 font-medium">
                Chave PIX ({pixKeyType}):
              </label>
              <Input
                id="pix-key-input"
                type="text"
                value={pixKey}
                onChange={(e) => {
                  setPixKey(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={currentPlaceholder}
                disabled={isSubmitting}
                className="font-mono text-sm h-9"
              />
              <p className="text-[11px] text-zinc-400">
                Autopreenchida com a chave cadastrada. Você pode alterá-la para este saque.
              </p>
            </div>
          </div>

          {/* Input do Valor */}
          <div className="space-y-1.5">
            <label htmlFor="withdraw-amount" className="text-xs font-medium text-zinc-700">
              Valor do Saque (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-mono">
                R$
              </span>
              <Input
                id="withdraw-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="pl-10 font-mono text-base font-semibold h-10"
              />
            </div>

            {/* Botões Rápidos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickSelect(val)}
                  disabled={isSubmitting || availableBalance < val}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  R$ {val}
                </button>
              ))}
              <button
                type="button"
                onClick={handleWithdrawAll}
                disabled={isSubmitting || availableBalance <= 0}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Tudo (R$ {availableBalance.toFixed(2).replace('.', ',')})
              </button>
            </div>
          </div>

          {/* Mensagens de Erro e Sucesso */}
          {errorMessage && (
            <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200/60 rounded-lg p-2.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg p-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isInvalidAmount ||
                isExceedingBalance ||
                isMissingPixKey ||
                Boolean(successMessage)
              }
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Saque'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
