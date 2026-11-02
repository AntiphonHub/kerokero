'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { submitOperationAction } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/lib/motion';

interface StepOperacaoFormProps {
  initialData?: {
    tablesCount?: number;
    orderMode?: 'direct' | 'waiter_approval';
    openingDays?: string;
    openingTime?: string;
    closingTime?: string;
  } | null;
}

const ALL_DAYS = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

export function StepOperacaoForm({ initialData }: StepOperacaoFormProps) {
  const router = useRouter();

  const [tablesCount, setTablesCount] = useState<number>(
    initialData?.tablesCount || 15,
  );
  const [orderMode, setOrderMode] = useState<'direct' | 'waiter_approval'>(
    initialData?.orderMode || 'direct',
  );

  let initialDays = ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  if (initialData?.openingDays) {
    try {
      initialDays = JSON.parse(initialData.openingDays);
    } catch {
      // keep fallback
    }
  }
  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('tablesCount', String(tablesCount));
      formData.set('orderMode', orderMode);
      formData.set('openingDays', JSON.stringify(selectedDays));

      const res = await submitOperationAction({}, formData);
      setIsPending(false);

      if (res.errors) {
        setErrors(res.errors);
        return;
      }
      if (res.message) {
        setMessage(res.message);
        return;
      }
      if (res.success && res.nextStep) {
        router.push(res.nextStep);
      }
    } catch (err: unknown) {
      setIsPending(false);
      const msg = err instanceof Error ? err.message : 'Erro ao salvar operação.';
      setMessage(msg);
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {message && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl"
        >
          {message}
        </motion.div>
      )}

      {/* Hidden inputs to pass state */}
      <input type="hidden" name="tablesCount" value={tablesCount} />
      <input type="hidden" name="orderMode" value={orderMode} />
      <input type="hidden" name="openingDays" value={JSON.stringify(selectedDays)} />

      {/* 1. Capacidade do salão */}
      <motion.div variants={itemVariants}>
        <span className="block text-sm font-bold text-zinc-900 mb-2">
          Capacidade do salão
        </span>
        <div className="flex items-center gap-4 bg-zinc-50/80 border border-zinc-200 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTablesCount((prev) => Math.max(1, prev - 1))}
              className="w-9 h-9 rounded-lg border border-zinc-300 bg-white text-zinc-900 font-semibold text-lg flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="text-xl font-extrabold text-zinc-900 min-w-11 text-center">
              {tablesCount}
            </span>
            <button
              type="button"
              onClick={() => setTablesCount((prev) => Math.min(200, prev + 1))}
              className="w-9 h-9 rounded-lg border border-zinc-300 bg-white text-zinc-900 font-semibold text-lg flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
          <div className="flex-1 pl-2">
            <strong className="block text-sm font-bold text-zinc-900 leading-snug">
              {tablesCount} mesas ativas
            </strong>
            <span className="text-xs text-zinc-500">
              Gera automaticamente os QR Codes com tokens seguros das mesas 01 a {tablesCount}.
            </span>
          </div>
        </div>
        {errors?.tablesCount && (
          <p className="mt-1 text-xs text-red-600">{errors.tablesCount[0]}</p>
        )}
      </motion.div>

      {/* 2. Modo de envio de pedidos */}
      <motion.div variants={itemVariants}>
        <span className="block text-sm font-bold text-zinc-900 mb-2">
          Modo de envio de pedidos
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div
            onClick={() => setOrderMode('direct')}
            className={`border rounded-2xl p-4 cursor-pointer transition-all ${
              orderMode === 'direct'
                ? 'border-amber-500 bg-amber-500/[0.04] ring-1 ring-amber-500/30 shadow-sm'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-zinc-900">
                Envio Direto (Modo Ágil)
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  orderMode === 'direct' ? 'border-amber-500' : 'border-zinc-300'
                }`}
              >
                {orderMode === 'direct' && (
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              O pedido do cliente vai direto para o KDS da cozinha com tolerância de 30s para cancelamento imediato. Máxima agilidade.
            </p>
          </div>

          <div
            onClick={() => setOrderMode('waiter_approval')}
            className={`border rounded-2xl p-4 cursor-pointer transition-all ${
              orderMode === 'waiter_approval'
                ? 'border-amber-500 bg-amber-500/[0.04] ring-1 ring-amber-500/30 shadow-sm'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-zinc-900">
                Aprovação do Garçom
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  orderMode === 'waiter_approval' ? 'border-amber-500' : 'border-zinc-300'
                }`}
              >
                {orderMode === 'waiter_approval' && (
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              O pedido exige aceitação prévia de um garçom no painel antes de ser enviado ao preparo. Maior controle inicial.
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3. Horário de funcionamento */}
      <motion.div variants={itemVariants}>
        <span className="block text-sm font-bold text-zinc-900 mb-2">
          Horário de funcionamento
        </span>
        <div className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white space-y-4">
          <div className="flex gap-2 flex-wrap">
            {ALL_DAYS.map((day) => {
              const active = selectedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`flex-1 min-w-[40px] h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/25'
                      : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {errors?.openingDays && (
            <p className="text-xs text-red-600">{errors.openingDays[0]}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap pt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="openingTime" className="text-xs sm:text-sm font-semibold text-zinc-600">
                Abertura:
              </label>
              <input
                type="text"
                id="openingTime"
                name="openingTime"
                defaultValue={initialData?.openingTime || '18:00'}
                placeholder="18:00"
                className="h-10 w-24 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900 focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-zinc-400 text-sm">até</span>
            <div className="flex items-center gap-2">
              <label htmlFor="closingTime" className="text-xs sm:text-sm font-semibold text-zinc-600">
                Fechamento:
              </label>
              <input
                type="text"
                id="closingTime"
                name="closingTime"
                defaultValue={initialData?.closingTime || '23:30'}
                placeholder="23:30"
                className="h-10 w-24 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          {(errors?.openingTime || errors?.closingTime) && (
            <p className="text-xs text-red-600">
              {errors?.openingTime?.[0] || errors?.closingTime?.[0]}
            </p>
          )}
        </div>
      </motion.div>

      {/* Action Bar */}
      <motion.div variants={itemVariants} className="pt-6 border-t border-zinc-100 flex items-center justify-between">
        <Link
          href="/onboarding/loja"
          className="h-12 px-6 rounded-full border border-zinc-200 text-zinc-600 font-semibold text-sm inline-flex items-center justify-center hover:text-zinc-900 hover:border-zinc-900 transition-all"
        >
          Voltar
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 px-7 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-sm shadow-amber-500/25 transition-all cursor-pointer"
        >
          {isPending ? 'Salvando...' : 'Salvar e continuar'}
        </Button>
      </motion.div>
    </motion.form>
  );
}
