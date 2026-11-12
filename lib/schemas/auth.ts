import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').trim(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').trim(),
  email: z.string().email('E-mail inválido').trim(),
  phone: z.string().min(14, 'Telefone inválido'),
  cpf: z.string().min(14, 'CPF inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  passwordConfirm: z.string().min(8, 'Mínimo 8 caracteres'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Senhas não coincidem',
  path: ['passwordConfirm'],
});

export const recoveryEmailSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
});

const otpCodeField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Informe os 6 dígitos do código');

export const recoveryCodeSchema = z.object({
  code: otpCodeField,
});

export const recoveryResetSchema = z
  .object({
    code: otpCodeField,
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(256, 'Máximo 256 caracteres'),
    passwordConfirm: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(256, 'Máximo 256 caracteres'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Senhas não coincidem',
    path: ['passwordConfirm'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type RecoveryEmailInput = z.infer<typeof recoveryEmailSchema>;
export type RecoveryCodeInput = z.infer<typeof recoveryCodeSchema>;
export type RecoveryResetInput = z.infer<typeof recoveryResetSchema>;

export type AuthFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;
