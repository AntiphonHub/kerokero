'use client';

import { useState, useTransition } from 'react';
import { updateTablesCapacityAction } from '@/actions/settings';
import { LayoutGrid, Plus, Minus, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

interface TablesTabProps {
  establishment: EstablishmentDocument;
}

export function TablesTab({ establishment }: TablesTabProps) {
  const [isPending, startTransition] = useTransition();
  const [currentCapacity, setCurrentCapacity] = useState<number>(establishment.tablesCount || 10);
  const [targetCount, setTargetCount] = useState<number>(establishment.tablesCount || 10);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleIncrement = () => {
    if (targetCount < 100) {
      setTargetCount((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (targetCount > 1) {
      setTargetCount((prev) => prev - 1);
    }
  };

  const handleSave = () => {
    if (targetCount === currentCapacity) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateTablesCapacityAction(targetCount);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Capacidade atualizada com sucesso!' });
        if (res.data?.tablesCount) {
          setCurrentCapacity(res.data.tablesCount);
        }
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao ajustar mesas.' });
      }
    });
  };

  const hasChanges = targetCount !== currentCapacity;

  return (
    <div className="space-y-6 max-w-3xl">
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

      {/* Card Principal de Capacidade */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <LayoutGrid className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Capacidade do Salão & Mesas</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-zinc-50/70 p-5 rounded-xl border border-zinc-200/80">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Capacidade Ativa
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-zinc-900">{targetCount}</span>
              <span className="text-xs font-medium text-zinc-500">
                {targetCount === 1 ? 'mesa cadastrada' : 'mesas cadastradas'}
              </span>
            </div>
            {hasChanges && (
              <span className="text-[11px] text-amber-600 font-medium block mt-1">
                Alteração não salva (capacidade atual no sistema: {currentCapacity} mesas)
              </span>
            )}
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isPending || targetCount <= 1}
              onClick={handleDecrement}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              aria-label="Diminuir mesas"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              min={1}
              max={100}
              value={targetCount}
              disabled={isPending}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 100) {
                  setTargetCount(val);
                }
              }}
              className="w-20 text-center font-bold text-base py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />

            <button
              type="button"
              disabled={isPending || targetCount >= 100}
              onClick={handleIncrement}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              aria-label="Aumentar mesas"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Diretrizes de Segurança */}
        <div className="space-y-2.5 text-xs text-zinc-600 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Como funciona a gestão de capacidade</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-zinc-700">
            <li>
              <strong>Aumento de mesas:</strong> Gera imediatamente novos QR Codes protegidos com tokens únicos prontos para impressão.
            </li>
            <li>
              <strong>Redução de mesas:</strong> Desativa as últimas mesas do mapa. O sistema bloqueia a redução se qualquer uma das mesas excedentes estiver ocupada ou com conta aberta.
            </li>
            <li>
              O Bempedi contempla até <strong>100 mesas ativas</strong> simultaneamente por estabelecimento.
            </li>
          </ul>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isPending || !hasChanges}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Atualizando capacidade...</span>
              </>
            ) : (
              <span>Confirmar Nova Capacidade</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
