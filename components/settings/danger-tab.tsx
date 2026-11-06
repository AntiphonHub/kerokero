'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccountAction } from '@/actions/settings';
import { AlertTriangle, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

interface DangerTabProps {
  establishment: EstablishmentDocument;
}

export function DangerTab({ establishment }: DangerTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isMatch = confirmName.trim().toLowerCase() === establishment.name.trim().toLowerCase();

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteAccountAction(confirmName);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Conta desativada com sucesso.' });
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao desativar conta.' });
      }
    });
  };

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

      {/* Danger Zone Card */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-rose-100 pb-3 text-rose-600">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="text-sm font-bold text-rose-700">Zona de Perigo: Exclusão Definitiva</h3>
        </div>

        <div className="space-y-3 text-xs text-zinc-600">
          <p className="leading-relaxed">
            Ao encerrar a sua conta no KeroKero:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-700">
            <li>Sua assinatura recorrente no Asaas será <strong>cancelada imediatamente</strong> sem gerar novas cobranças.</li>
            <li>O acesso de garçons e da cozinha ao KDS será <strong>bloqueado</strong>.</li>
            <li>Os QR Codes das mesas serão desativados permanentemente.</li>
            <li>Não será possível desfazer esta operação após a confirmação.</li>
          </ul>
        </div>

        <form onSubmit={handleDelete} className="space-y-4 pt-2 border-t border-zinc-100">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 block">
              Para confirmar, digite o nome exato da sua loja (<strong className="font-semibold text-zinc-900">{establishment.name}</strong>):
            </label>
            <input
              type="text"
              required
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={establishment.name}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-200 bg-rose-50/20 text-zinc-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!isMatch || isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Excluindo conta...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir Estabelecimento & Cancelar Plano</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
