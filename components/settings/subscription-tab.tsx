'use client';

import { useState, useTransition } from 'react';
import { cancelSubscriptionAction } from '@/actions/settings';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

interface SubscriptionTabProps {
  establishment: EstablishmentDocument;
}

export function SubscriptionTab({ establishment }: SubscriptionTabProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(establishment.subscriptionStatus || 'active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCancelSubscription = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await cancelSubscriptionAction();
      setIsModalOpen(false);
      if (res.success) {
        setStatus('canceled');
        setFeedback({ type: 'success', message: res.message || 'Assinatura cancelada com sucesso.' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao cancelar assinatura.' });
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

      {/* Card do Plano Atual */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Plano & Assinatura SaaS</h3>
          </div>
          <div>
            {isCanceled ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                Cancelada
              </span>
            ) : status === 'active' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ativa no Asaas
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Detalhes do Plano */}
        <div className="bg-zinc-50/70 p-5 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Plano Atual
              </span>
              <h4 className="text-base font-bold text-zinc-900 mt-0.5">KeroKero Estabelecimentos</h4>
            </div>
            <div className="sm:text-right">
              <span className="text-xl font-extrabold text-zinc-900">R$ 99,00</span>
              <span className="text-xs font-medium text-zinc-500"> / mês</span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200/60 text-xs text-zinc-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Forma de Cobrança:</span>
              <span className="font-medium text-zinc-800">Recorrência Automática (Asaas)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Identificador da Assinatura:</span>
              <span className="font-mono text-zinc-700">
                {establishment.asaasSubscriptionId || 'sub_demo_kerokero'}
              </span>
            </div>
          </div>
        </div>

        {/* Recursos Inclusos */}
        <div className="space-y-2 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-800 block">Recursos inclusos no seu plano:</span>
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
            <span className="text-xs font-semibold text-zinc-800 block">Cancelar Assinatura</span>
            <p className="text-xs text-zinc-500">
              Interrompe novas renovações mensais no Asaas.
            </p>
          </div>

          <button
            type="button"
            disabled={isCanceled || isPending}
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            {isCanceled ? 'Assinatura Cancelada' : 'Cancelar Plano'}
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
                <h4 className="text-sm font-bold text-zinc-900">Confirmar Cancelamento</h4>
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
              Tem certeza que deseja cancelar sua assinatura recorrente? Sua conta manterá os acessos ativos até o final do período já faturado, e não haverá nenhuma cobrança futura no gateway Asaas.
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
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <span>Sim, Cancelar Plano</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
