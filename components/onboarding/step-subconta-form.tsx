'use client';

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { submitSubaccountAction } from '@/actions/onboarding';
import { MaskedInput } from '@/components/ui/masked-input';
import { maskCpf } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud } from 'lucide-react';
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

  const [docIdFile, setDocIdFile] = useState<File | null>(null);
  const [docCnpjFile, setDocCnpjFile] = useState<File | null>(null);

  const docIdInputRef = useRef<HTMLInputElement>(null);
  const docCnpjInputRef = useRef<HTMLInputElement>(null);

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handleDocIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocIdFile(e.target.files[0]);
    }
  };

  const handleDocCnpjChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocCnpjFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (docIdFile) formData.set('docId', docIdFile);
      if (docCnpjFile) formData.set('docCnpj', docCnpjFile);

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
      const msg = err instanceof Error ? err.message : 'Erro ao processar documentação.';
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

        {/* Right Column: KYC Upload Cards to Cloudflare R2 */}
        <motion.div variants={itemVariants} className="space-y-4">
          <span className="block text-sm font-bold text-zinc-900 pb-2 border-b border-zinc-100">
            Documentação obrigatória (KYC)
          </span>

          {/* Upload 1: CNH ou RG */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Documento de identificação (CNH ou RG)
            </label>
            <input
              type="file"
              ref={docIdInputRef}
              name="docId"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleDocIdChange}
              className="hidden"
            />
            {docIdFile ? (
              <div className="border border-zinc-200 rounded-2xl p-3.5 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-zinc-900 truncate max-w-[200px]">
                      {docIdFile.name}
                    </strong>
                    <span className="text-[11px] text-zinc-500">
                      {(docIdFile.size / 1024 / 1024).toFixed(1)} MB • Pronto para envio
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => docIdInputRef.current?.click()}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline"
                >
                  Substituir
                </button>
              </div>
            ) : (
              <div
                onClick={() => docIdInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 rounded-2xl p-5 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-500/[0.02] transition-colors bg-zinc-50/50"
              >
                <UploadCloud className="w-7 h-7 mx-auto text-amber-500 mb-1.5" />
                <span className="block text-xs font-bold text-zinc-800 mb-0.5">
                  Clique ou selecione o documento CNH/RG
                </span>
                <span className="block text-[11px] text-zinc-500 mb-2.5">
                  Formatos PDF, PNG ou JPG até 10 MB
                </span>
                <button
                  type="button"
                  className="h-8 px-4 rounded-lg bg-white border border-zinc-300 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                >
                  Procurar arquivo
                </button>
              </div>
            )}
            {errors?.docId && (
              <p className="mt-1 text-xs text-red-600">{errors.docId[0]}</p>
            )}
          </div>

          {/* Upload 2: Cartão CNPJ ou Contrato Social */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Cartão CNPJ ou Contrato Social
            </label>
            <input
              type="file"
              ref={docCnpjInputRef}
              name="docCnpj"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleDocCnpjChange}
              className="hidden"
            />
            {docCnpjFile ? (
              <div className="border border-zinc-200 rounded-2xl p-3.5 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-zinc-900 truncate max-w-[200px]">
                      {docCnpjFile.name}
                    </strong>
                    <span className="text-[11px] text-zinc-500">
                      {(docCnpjFile.size / 1024 / 1024).toFixed(1)} MB • Pronto para envio
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => docCnpjInputRef.current?.click()}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline"
                >
                  Substituir
                </button>
              </div>
            ) : (
              <div
                onClick={() => docCnpjInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 rounded-2xl p-5 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-500/[0.02] transition-colors bg-zinc-50/50"
              >
                <UploadCloud className="w-7 h-7 mx-auto text-amber-500 mb-1.5" />
                <span className="block text-xs font-bold text-zinc-800 mb-0.5">
                  Clique ou selecione o Cartão CNPJ
                </span>
                <span className="block text-[11px] text-zinc-500 mb-2.5">
                  Formatos PDF, PNG ou JPG até 10 MB
                </span>
                <button
                  type="button"
                  className="h-8 px-4 rounded-lg bg-white border border-zinc-300 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                >
                  Procurar arquivo
                </button>
              </div>
            )}
            {errors?.docCnpj && (
              <p className="mt-1 text-xs text-red-600">{errors.docCnpj[0]}</p>
            )}
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
          {isPending ? 'Processando integração...' : 'Enviar documentação e finalizar'}
        </Button>
      </motion.div>
    </motion.form>
  );
}
