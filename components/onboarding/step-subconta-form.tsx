'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { submitSubaccountAction } from '@/actions/onboarding';
import { MaskedInput } from '@/components/ui/masked-input';
import { maskCpf } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/motion';

interface StepSubcontaFormProps {
  initialData?: {
    repName?: string;
    repCpf?: string;
    repBirthDate?: string;
    bankCode?: string;
    bankPixKey?: string;
    bankAgency?: string;
    bankAccount?: string;
    cnpj?: string;
  } | null;
}

export function StepSubcontaForm({ initialData }: StepSubcontaFormProps) {
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await submitSubaccountAction({}, formData);
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
      const msg = err instanceof Error ? err.message : 'Erro ao processar dados da subconta.';
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Bank & Representative Info */}
        <motion.div variants={itemVariants} className="space-y-5">
          <div>
            <span className="block text-sm font-bold text-zinc-900 pb-2 border-b border-zinc-100 mb-3">
              Representante legal da empresa
            </span>

            <div className="space-y-3">
              <div>
                <label htmlFor="repName" className="block text-xs font-semibold text-zinc-800 mb-1">
                  Nome do sócio administrador
                </label>
                <input
                  type="text"
                  id="repName"
                  name="repName"
                  defaultValue={initialData?.repName || ''}
                  placeholder="Nome completo do titular"
                  required
                  className="w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                />
                {errors?.repName && (
                  <p className="mt-1 text-xs text-red-600">{errors.repName[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="repCpf" className="block text-xs font-semibold text-zinc-800 mb-1">
                    CPF do responsável
                  </label>
                  <MaskedInput
                    id="repCpf"
                    name="repCpf"
                    mask={maskCpf}
                    defaultValue={initialData?.repCpf ? maskCpf(initialData.repCpf) : ''}
                    placeholder="000.000.000-00"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors?.repCpf && (
                    <p className="mt-1 text-xs text-red-600">{errors.repCpf[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="repBirthDate" className="block text-xs font-semibold text-zinc-800 mb-1">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    id="repBirthDate"
                    name="repBirthDate"
                    defaultValue={initialData?.repBirthDate || '1988-06-14'}
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-900 bg-white focus:outline-none focus:border-amber-500"
                  />
                  {errors?.repBirthDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.repBirthDate[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="block text-sm font-bold text-zinc-900 pb-2 border-b border-zinc-100 mb-3 pt-2">
              Conta bancária de liquidação
            </span>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bankCode" className="block text-xs font-semibold text-zinc-800 mb-1">
                    Instituição Financeira
                  </label>
                  <select
                    id="bankCode"
                    name="bankCode"
                    defaultValue={initialData?.bankCode || '341'}
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="341">Itaú Unibanco S.A. (341)</option>
                    <option value="237">Bradesco S.A. (237)</option>
                    <option value="260">Nu Pagamentos S.A. (260)</option>
                    <option value="077">Banco Inter S.A. (077)</option>
                    <option value="033">Banco Santander (033)</option>
                    <option value="001">Banco do Brasil (001)</option>
                    <option value="104">Caixa Econômica (104)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="bankPixKey" className="block text-xs font-semibold text-zinc-800 mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    id="bankPixKey"
                    name="bankPixKey"
                    defaultValue={initialData?.bankPixKey || initialData?.cnpj || ''}
                    placeholder="Chave PIX da empresa"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors?.bankPixKey && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankPixKey[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bankAgency" className="block text-xs font-semibold text-zinc-800 mb-1">
                    Agência
                  </label>
                  <input
                    type="text"
                    id="bankAgency"
                    name="bankAgency"
                    defaultValue={initialData?.bankAgency || ''}
                    placeholder="0000"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors?.bankAgency && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankAgency[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bankAccount" className="block text-xs font-semibold text-zinc-800 mb-1">
                    Conta Corrente PJ
                  </label>
                  <input
                    type="text"
                    id="bankAccount"
                    name="bankAccount"
                    defaultValue={initialData?.bankAccount || ''}
                    placeholder="00000-0"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                  {errors?.bankAccount && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankAccount[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Asaas Compliance & Account Activation Card */}
        <motion.div variants={itemVariants} className="space-y-4">
          <span className="block text-sm font-bold text-zinc-900 pb-2 border-b border-zinc-100">
            Validação Regulatória & Ativação
          </span>

          <div className="bg-zinc-50/80 border border-zinc-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-900">
                  Subconta Bancária Asaas Integrada
                </h3>
                <p className="text-[11.5px] text-zinc-600 leading-relaxed">
                  Os pagamentos via PIX realizados nas mesas caem diretamente na sua subconta Asaas vinculada ao seu CNPJ.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200/60 space-y-2.5 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recebimentos instantâneos por PIX já habilitados na mesa</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>7 dias de teste gratuito liberados imediatamente</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span className="text-zinc-500">
                  A biometria facial e documentos regulatórios do Bacen são validados pelo link oficial do Asaas na Carteira para liberação de saques.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Bar */}
      <motion.div variants={itemVariants} className="pt-6 border-t border-zinc-100 flex items-center justify-between">
        <Link
          href="/onboarding/operacao"
          className="h-12 px-6 rounded-full border border-zinc-200 text-zinc-600 font-semibold text-sm inline-flex items-center justify-center hover:text-zinc-900 hover:border-zinc-900 transition-all"
        >
          Voltar
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 px-7 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-sm shadow-amber-500/25 transition-all cursor-pointer"
        >
          {isPending ? 'Criando subconta e ativando teste...' : 'Concluir cadastro e iniciar teste grátis'}
        </Button>
      </motion.div>
    </motion.form>
  );
}
