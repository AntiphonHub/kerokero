'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { loginSchema } from '@/lib/schemas/auth';

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage(null);

    // 1. Client-side Zod validation
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsPending(true);

    try {
      await signIn.emailPassword({
        email: parsed.data.email,
        password: parsed.data.password,
        onSuccess: () => {
          router.replace('/dashboard');
          router.refresh();
        },
        onError: (error) => {
          setIsPending(false);
          const msg = error?.message || 'E-mail ou senha inválidos.';
          if (msg.includes('Invalid credentials') || msg.includes('user_invalid_credentials')) {
            setErrorMessage('E-mail ou senha incorretos.');
          } else {
            setErrorMessage(msg);
          }
        },
      });
    } catch (err: unknown) {
      setIsPending(false);
      setErrorMessage(err instanceof Error ? err.message : 'Falha na conexão com o servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      <Input
        name="password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        error={errors.password?.[0]}
        rightElement={
          <Link
            href="#"
            className="text-[13px] font-medium text-zinc-500 no-underline transition-colors hover:text-zinc-900 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        }
      />

      {errorMessage && (
        <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-1"
      >
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Não tem uma conta?{' '}
        <Link
          href="/cadastro"
          className="font-bold text-zinc-900 no-underline border-b-[1.5px] border-zinc-900 pb-px transition-colors hover:text-amber-500 hover:border-amber-500"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
