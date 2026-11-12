'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAppwrite, useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import {
  recoveryCodeSchema,
  recoveryEmailSchema,
  recoveryResetSchema,
} from '@/lib/schemas/auth';
import {
  OTP_LENGTH,
  RECOVERY_REQUEST_SUCCESS_MESSAGE,
  normalizeRecoveryError,
} from '@/lib/auth/recovery';
import { cn } from '@/lib/utils';
import { containerVariants, itemVariants } from '@/lib/motion';

type RecoveryStep = 'email' | 'code' | 'password' | 'signin_fallback';

const RESEND_COOLDOWN_SECONDS = 60;

const STEP_INDEX: Record<Exclude<RecoveryStep, 'signin_fallback'>, 1 | 2 | 3> = {
  email: 1,
  code: 2,
  password: 3,
};

function FormAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <motion.p
      variants={itemVariants}
      className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm font-medium text-red-600"
      role="alert"
    >
      {message}
    </motion.p>
  );
}

function BackToLoginLink() {
  return (
    <motion.p
      variants={itemVariants}
      className="text-center text-sm text-zinc-500"
    >
      Lembrou a senha?{' '}
      <Link
        href="/login"
        className="border-b-[1.5px] border-zinc-900 pb-px font-bold text-zinc-900 no-underline transition-colors hover:border-amber-500 hover:text-amber-500"
      >
        Voltar para o login
      </Link>
    </motion.p>
  );
}

export function ForgotPasswordForm() {
  const { account } = useAppwrite();
  const { signIn } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [securityPhrase, setSecurityPhrase] = useState<string | null>(null);

  const [otpDigits, setOtpDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill(''),
  );
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const requestOtpForEmail = async (targetEmail: string) => {
    const token = await account.createRecoveryOTP({
      email: targetEmail,
      phrase: true,
    });

    setUserId(token.userId);
    setSubmittedEmail(targetEmail);
    setSecurityPhrase(
      typeof token.phrase === 'string' && token.phrase.trim()
        ? token.phrase.trim()
        : null,
    );
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleRequestSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setErrorMessage(null);

    const parsed = recoveryEmailSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsPending(true);
    try {
      await requestOtpForEmail(parsed.data.email);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setPassword('');
      setPasswordConfirm('');
      setStep('code');
    } catch (error) {
      const normalized = normalizeRecoveryError(error);
      setErrorMessage(normalized.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail || cooldown > 0 || isResending || isPending) {
      return;
    }

    setErrors({});
    setErrorMessage(null);
    setIsResending(true);

    try {
      await requestOtpForEmail(submittedEmail);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (error) {
      const normalized = normalizeRecoveryError(error);
      setErrorMessage(normalized.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    setErrors({});
    setErrorMessage(null);
    setUserId('');
    setSecurityPhrase(null);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setPassword('');
    setPasswordConfirm('');
    setStep('email');
  };

  const handleCodeSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setErrorMessage(null);

    if (!userId) {
      handleChangeEmail();
      return;
    }

    const parsed = recoveryCodeSchema.safeParse({
      code: otpDigits.join(''),
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setStep('password');
  };

  const handleResetSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setErrorMessage(null);

    if (!userId) {
      handleChangeEmail();
      return;
    }

    const parsed = recoveryResetSchema.safeParse({
      code: otpDigits.join(''),
      password,
      passwordConfirm,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.code?.length) {
        setErrors({ code: fieldErrors.code });
        setStep('code');
        return;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    setStatusLabel('Redefinindo...');

    try {
      await account.updateRecoveryOTP({
        userId,
        secret: parsed.data.code,
        password: parsed.data.password,
      });
    } catch (error) {
      const normalized = normalizeRecoveryError(error);
      setIsPending(false);
      setStatusLabel(null);

      if (normalized.kind === 'invalid_code') {
        setErrors({ code: [normalized.message] });
        setStep('code');
        return;
      }

      if (normalized.field) {
        setErrors({ [normalized.field]: [normalized.message] });
      } else {
        setErrorMessage(normalized.message);
      }
      return;
    }

    // updateRecoveryOTP does not create a session; authenticate with the new password.
    setStatusLabel('Entrando...');
    try {
      await signIn.emailPassword({
        email: submittedEmail,
        password: parsed.data.password,
        onSuccess: () => {
          router.replace('/dashboard');
          router.refresh();
        },
        onError: () => {
          setIsPending(false);
          setStatusLabel(null);
          setStep('signin_fallback');
        },
      });
    } catch {
      setIsPending(false);
      setStatusLabel(null);
      setStep('signin_fallback');
    }
  };

  if (step === 'signin_fallback') {
    return (
      <div>
        <div className="mb-7">
          <h1 className="text-[32px] lg:text-[34px] font-extrabold tracking-[-0.035em] text-zinc-900 leading-tight mb-1.5">
            Senha redefinida
          </h1>
          <p className="text-[16px] lg:text-[17px] text-zinc-400 font-medium tracking-tight">
            Entre usando sua nova senha
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <p className="text-sm font-semibold text-zinc-900">
              Senha redefinida com sucesso.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Não foi possível iniciar sua sessão automaticamente. Clique abaixo
              para entrar com a nova senha.
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/login"
              className="btn-primary inline-flex w-full items-center justify-center no-underline"
            >
              Ir para o login
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const currentStep = STEP_INDEX[step];

  const stepHeader = {
    email: {
      title: 'Redefinir senha',
      subtitle: 'Informe seu e-mail para receber o código de 6 dígitos.',
    },
    code: {
      title: 'Digite o código',
      subtitle: `${RECOVERY_REQUEST_SUCCESS_MESSAGE} (${submittedEmail})`,
    },
    password: {
      title: 'Nova senha',
      subtitle: 'Escolha uma senha segura com no mínimo 8 caracteres.',
    },
  }[step];

  return (
    <div>
      <div className="mb-7">
        <div
          className="mb-4 flex items-center gap-3"
          aria-label={`Etapa ${currentStep} de 3`}
        >
          <span className="shrink-0 text-xs font-semibold text-zinc-400">
            Etapa {currentStep} de 3
          </span>
          <div className="flex flex-1 gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  n <= currentStep ? 'bg-zinc-900' : 'bg-zinc-200',
                )}
              />
            ))}
          </div>
        </div>

        <h1 className="text-[32px] lg:text-[34px] font-extrabold tracking-[-0.035em] text-zinc-900 leading-tight mb-1.5">
          {stepHeader.title}
        </h1>
        <p className="text-[15px] lg:text-[16px] text-zinc-400 font-medium tracking-tight">
          {stepHeader.subtitle}
        </p>
      </div>

      {step === 'email' && (
        <motion.form
          key="email-step"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleRequestSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <motion.div variants={itemVariants}>
            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="voce@estabelecimento.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: [] }));
                }
              }}
              autoComplete="email"
              autoFocus
              disabled={isPending}
              error={errors.email?.[0]}
            />
          </motion.div>

          <FormAlert message={errorMessage} />

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary mt-1 w-full"
            >
              {isPending ? 'Enviando...' : 'Enviar código'}
            </button>
          </motion.div>

          <BackToLoginLink />
        </motion.form>
      )}

      {step === 'code' && (
        <motion.form
          key="code-step"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleCodeSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          {securityPhrase ? (
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-zinc-200 border-l-[3px] border-l-amber-500 bg-zinc-50 px-3.5 py-2.5"
            >
              <p className="text-xs font-medium text-zinc-600">
                Frase de segurança:{' '}
                <strong className="font-semibold text-zinc-900">
                  {securityPhrase}
                </strong>
              </p>
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <OtpInput
              value={otpDigits}
              onChange={(nextDigits) => {
                setOtpDigits(nextDigits);
                if (errors.code) {
                  setErrors((prev) => ({ ...prev, code: [] }));
                }
              }}
              error={errors.code?.[0]}
              disabled={isPending}
              autoFocus
              rightElement={
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending || isPending}
                  className="text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
                >
                  {isResending
                    ? 'Reenviando...'
                    : cooldown > 0
                      ? `Reenviar (${cooldown}s)`
                      : 'Reenviar código'}
                </button>
              }
            />
          </motion.div>

          <FormAlert message={errorMessage} />

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary mt-1 w-full"
            >
              Continuar
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <button
              type="button"
              onClick={handleChangeEmail}
              disabled={isPending}
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
            >
              Alterar e-mail
            </button>
          </motion.div>
        </motion.form>
      )}

      {step === 'password' && (
        <motion.form
          key="password-step"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleResetSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <motion.div variants={itemVariants}>
            <Input
              name="password"
              type="password"
              label="Nova senha"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: [] }));
                }
              }}
              autoComplete="new-password"
              autoFocus
              disabled={isPending}
              error={errors.password?.[0]}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              name="passwordConfirm"
              type="password"
              label="Confirmar nova senha"
              placeholder="Repita a nova senha"
              value={passwordConfirm}
              onChange={(event) => {
                setPasswordConfirm(event.target.value);
                if (errors.passwordConfirm) {
                  setErrors((prev) => ({ ...prev, passwordConfirm: [] }));
                }
              }}
              autoComplete="new-password"
              disabled={isPending}
              error={errors.passwordConfirm?.[0]}
            />
          </motion.div>

          <FormAlert message={errorMessage} />

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary mt-1 w-full"
            >
              {isPending ? (statusLabel ?? 'Redefinindo...') : 'Redefinir senha'}
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setErrorMessage(null);
                setStep('code');
              }}
              disabled={isPending}
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
            >
              Voltar para o código
            </button>
          </motion.div>
        </motion.form>
      )}
    </div>
  );
}
