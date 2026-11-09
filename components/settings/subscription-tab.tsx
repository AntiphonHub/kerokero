'use client';

import { useState, useTransition, useEffect } from 'react';
import { cancelSubscriptionAction } from '@/actions/settings';
import {
  getSubscriptionPixAction,
  checkSubscriptionStatusAction,
} from '@/actions/onboarding';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  X,
  ShieldAlert,
  Copy,
  CheckCheck,
} from 'lucide-react';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

interface SubscriptionTabProps {
  establishment: EstablishmentDocument;
}

export function SubscriptionTab({ establishment }: SubscriptionTabProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(establishment.subscriptionStatus || 'trialing');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [pixImage, setPixImage] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoadingPix, setIsLoadingPix] = useState(false);

  useEffect(() => {
    if (status !== 'active') {
      setIsLoadingPix(true);
      getSubscriptionPixAction().then((data) => {
        setIsLoadingPix(false);
        if (data) {
          setPixImage(data.encodedImage);
          setPixPayload(data.payload);
        }
      });

      const interval = setInterval(async () => {
        try {
          const currentStatus = await checkSubscriptionStatusAction();
          if (currentStatus === 'active') {
            setStatus('active');
            clearInterval(interval);
          }
        } catch {
          // retry
        }
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const handleCopyPix = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCancelSubscription = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await cancelSubscriptionAction();
      setIsModalOpen(false);
      if (res.success) {
        setStatus('canceled');
        setFeedback({ type: 'success', message: res.message || 'Acesso cancelado com sucesso.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao cancelar acesso.' });
      }
    });
  };

  const isCanceled = status === 'canceled';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Card da Mensalidade */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Mensalidade do Sistema</h3>
          </div>
          <div>
            {isCanceled ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                Cancelado
              </span>
            ) : status === 'active' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ativo
              </span>
            ) : status === 'trialing' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Teste Gratuito (7 dias)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Detalhes da Mensalidade */}
        <div className="bg-zinc-50/70 p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Uso do Sistema
              </span>
              <h4 className="text-base font-bold text-zinc-900 mt-0.5">Acesso Bempedi</h4>
            </div>
            <div className="sm:text-right">
              <span className="text-xl font-extrabold text-zinc-900">R$ 149,00</span>
              <span className="text-xs font-medium text-zinc-500"> / mês</span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200/60 text-xs text-zinc-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Cobrança:</span>
              <span className="font-medium text-zinc-800">Mensalidade Automática</span>
            </div>
          </div>
        </div>

        {/* Checkout PIX quando não ativo (Trialing ou Pendente) */}
        {status !== 'active' && (
          <div className="bg-white border-2 border-amber-500/80 rounded-2xl p-5 text-center space-y-4 shadow-sm overflow-hidden">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Ativação Definitiva da Assinatura
              </span>
              <h2 className="text-lg font-extrabold text-zinc-900">
                R$ 149,00 / mês
              </h2>
              <p className="text-xs text-zinc-500">
                Escaneie o QR Code abaixo no app do seu banco para ativar instantaneamente:
              </p>
            </div>

            {pixImage ? (
              <div className="flex justify-center my-3">
                <img
                  src={`data:image/png;base64,${pixImage}`}
                  alt="QR Code PIX Mensalidade Bempedi"
                  className="w-44 h-44 rounded-xl border border-zinc-200 p-2 bg-white"
                />
              </div>
            ) : (
              <div className="w-44 h-44 mx-auto rounded-xl bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">
                {isLoadingPix ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Carregando QR Code...</span>
                  </div>
                ) : (
                  <span>Carregando QR Code...</span>
                )}
              </div>
            )}

            {pixPayload && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                      Chave PIX copiada com sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-700" />
                      Copiar código PIX (Copia e Cola)
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>Identificando pagamento em tempo real...</span>
            </div>
          </div>
        )}

        {/* Recursos Inclusos */}
        <div className="space-y-2 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-800 block">Recursos inclusos no Bempedi:</span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Cardápio digital e comandas em tempo real</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>KDS da Cozinha 100% digital</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Split dinâmico e PIX no celular do cliente</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Métricas de vendas, ticket médio e permanência</span>
            </li>
          </ul>
        </div>

        {/* Ação de Cancelamento */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-800 block">Encerrar Acesso</span>
            <p className="text-xs text-zinc-500">
              Interrompe a renovação da mensalidade.
            </p>
          </div>

          <button
            type="button"
            disabled={isCanceled || isPending}
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            {isCanceled ? 'Acesso Encerrado' : 'Encerrar Acesso'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-zinc-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
                <h4 className="text-sm font-bold text-zinc-900">Confirmar Encerramento de Acesso</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Tem certeza que deseja encerrar o acesso ao sistema? Sua conta continuará ativa até o final do período já pago, e não haverá novas cobranças.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCancelSubscription}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Encerrando...</span>
                  </>
                ) : (
                  <span>Sim, Encerrar Acesso</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
