'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { submitStoreDataAction } from '@/actions/onboarding';
import { MaskedInput } from '@/components/ui/masked-input';
import { maskCnpj, maskPhone, maskCep } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/lib/motion';

interface StepLojaFormProps {
  initialData?: {
    name?: string;
    legalName?: string;
    cnpj?: string;
    category?: string;
    phone?: string;
    postalCode?: string;
    address?: string;
  } | null;
}

export function StepLojaForm({ initialData }: StepLojaFormProps) {
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
      const res = await submitStoreDataAction({}, formData);
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
      const msg = err instanceof Error ? err.message : 'Erro ao salvar dados.';
      setMessage(msg);
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {message && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl"
        >
          {message}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <label htmlFor="name" className="block text-sm font-semibold text-zinc-900 mb-1.5">
          Nome fantasia do estabelecimento
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={initialData?.name || ''}
          placeholder="Ex: Kero Burguer & Bar"
          required
          className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
        {errors?.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="legalName" className="block text-sm font-semibold text-zinc-900 mb-1.5">
            Razão Social
          </label>
          <input
            type="text"
            id="legalName"
            name="legalName"
            defaultValue={initialData?.legalName || ''}
            placeholder="Razão social oficial"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors?.legalName && (
            <p className="mt-1 text-xs text-red-600">{errors.legalName[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="cnpj" className="block text-sm font-semibold text-zinc-900 mb-1.5">
            CNPJ
          </label>
          <MaskedInput
            id="cnpj"
            name="cnpj"
            mask={maskCnpj}
            defaultValue={initialData?.cnpj ? maskCnpj(initialData.cnpj) : ''}
            placeholder="00.000.000/0000-00"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors?.cnpj && (
            <p className="mt-1 text-xs text-red-600">{errors.cnpj[0]}</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-zinc-900 mb-1.5">
            Categoria principal
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initialData?.category || 'hamburgueria'}
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
          >
            <option value="hamburgueria">Hamburgueria & Lanchonete</option>
            <option value="bar">Bar, Pub & Petiscaria</option>
            <option value="restaurante">Restaurante Tradicional / Buffet</option>
            <option value="pizzaria">Pizzaria</option>
            <option value="cafeteria">Cafeteria & Bistrô</option>
          </select>
          {errors?.category && (
            <p className="mt-1 text-xs text-red-600">{errors.category[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-zinc-900 mb-1.5">
            Telefone comercial / WhatsApp
          </label>
          <MaskedInput
            id="phone"
            name="phone"
            mask={maskPhone}
            defaultValue={initialData?.phone ? maskPhone(initialData.phone) : ''}
            placeholder="(11) 99999-9999"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors?.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone[0]}</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label htmlFor="postalCode" className="block text-sm font-semibold text-zinc-900 mb-1.5">
            CEP
          </label>
          <MaskedInput
            id="postalCode"
            name="postalCode"
            mask={maskCep}
            defaultValue={initialData?.postalCode ? maskCep(initialData.postalCode) : ''}
            placeholder="00000-000"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors?.postalCode && (
            <p className="mt-1 text-xs text-red-600">{errors.postalCode[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-semibold text-zinc-900 mb-1.5">
            Endereço completo (Rua, nº, Bairro)
          </label>
          <input
            type="text"
            id="address"
            name="address"
            defaultValue={initialData?.address || ''}
            placeholder="Logradouro, número e complemento"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors?.address && (
            <p className="mt-1 text-xs text-red-600">{errors.address[0]}</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-end">
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
