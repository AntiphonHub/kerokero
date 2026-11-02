'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { maskPhone, maskCpf } from '@/lib/masks';
import { signup } from '@/actions/auth';
import { signupSchema } from '@/lib/schemas/auth';
import { containerVariants, itemVariants } from '@/lib/motion';

export function SignupForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage(null);

    // 1. Client-side Zod validation
    const parsed = signupSchema.safeParse({
      name,
      email,
      phone,
      cpf,
      password,
      passwordConfirm,
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsPending(true);

    const formData = new FormData();
    formData.set('name', name);
    formData.set('email', email);
    formData.set('phone', phone);
    formData.set('cpf', cpf);
    formData.set('password', password);
    formData.set('passwordConfirm', passwordConfirm);

    try {
      const result = await signup(undefined, formData);
      if (result?.errors) {
        setErrors(result.errors);
        if (result.message) {
          setErrorMessage(result.message);
        }
        setIsPending(false);
        return;
      }
      if (result?.message) {
        setErrorMessage(result.message);
        setIsPending(false);
        return;
      }

      // 2. Successful creation -> sign in to establish session cookie
      await signIn.emailPassword({
        email,
        password,
        onSuccess: () => {
          router.replace('/dashboard');
          router.refresh();
        },
        onError: (err) => {
          setIsPending(false);
          setErrorMessage(err?.message || 'Conta criada! Faça login para continuar.');
        },
      });
    } catch (err: unknown) {
      setIsPending(false);
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao processar cadastro.');
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3.5"
    >
      <motion.div variants={itemVariants}>
        <Input
          name="name"
          type="text"
          label="Nome completo"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          error={errors.name?.[0]}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          name="email"
          type="email"
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          error={errors.email?.[0]}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MaskedInput
          name="phone"
          type="tel"
          label="Telefone"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
          mask={maskPhone}
          error={errors.phone?.[0]}
        />
        <MaskedInput
          name="cpf"
          type="text"
          label="CPF"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          required
          mask={maskCpf}
          error={errors.cpf?.[0]}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          name="password"
          type="password"
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          error={errors.password?.[0]}
        />
        <Input
          name="passwordConfirm"
          type="password"
          label="Confirma senha"
          placeholder="••••••••"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          autoComplete="new-password"
          error={errors.passwordConfirm?.[0]}
        />
      </motion.div>

      {errorMessage && (
        <motion.p
          variants={itemVariants}
          className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5"
        >
          {errorMessage}
        </motion.p>
      )}

      <motion.div variants={itemVariants}>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary mt-2 w-full"
        >
          {isPending ? 'Criando conta...' : 'Criar conta'}
        </button>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-[13.5px] text-zinc-500">
        Já possui uma conta?{' '}
        <Link
          href="/login"
          className="font-bold text-zinc-900 no-underline border-b-[1.5px] border-zinc-900 pb-px transition-colors hover:text-amber-500 hover:border-amber-500"
        >
          Entrar
        </Link>
      </motion.p>
    </motion.form>
  );
}
