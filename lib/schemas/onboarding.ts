import { z } from 'zod';
import { isValidCnpj } from '@/lib/validators/cnpj';
import { isValidCpf } from '@/lib/validators/cpf';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// Step 1: Dados da Loja
export const storeDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome fantasia muito longo' }),
  legalName: z
    .string()
    .trim()
    .min(3, { message: 'Razão social deve ter pelo menos 3 caracteres' })
    .max(150, { message: 'Razão social muito longa' }),
  cnpj: z
    .string()
    .trim()
    .refine((val) => isValidCnpj(val), {
      message: 'CNPJ inválido',
    })
    .transform((val) => val.replace(/\D/g, '')),
  category: z
    .enum(['hamburgueria', 'bar', 'restaurante', 'pizzaria', 'cafeteria'], {
      message: 'Selecione uma categoria válida',
    }),
  phone: z
    .string()
    .trim()
    .refine((val) => val.replace(/\D/g, '').length >= 10, {
      message: 'Telefone inválido',
    })
    .transform((val) => val.replace(/\D/g, '')),
  postalCode: z
    .string()
    .trim()
    .refine((val) => val.replace(/\D/g, '').length === 8, {
      message: 'CEP deve conter 8 dígitos',
    })
    .transform((val) => val.replace(/\D/g, '')),
  address: z
    .string()
    .trim()
    .min(5, { message: 'Endereço completo é obrigatório' })
    .max(255, { message: 'Endereço muito longo' }),
});

export type StoreDataInput = z.input<typeof storeDataSchema>;
export type StoreDataOutput = z.output<typeof storeDataSchema>;

// Step 2: Operação & Mesas
export const operationSchema = z.object({
  tablesCount: z.coerce
    .number()
    .int({ message: 'Quantidade de mesas deve ser um número inteiro' })
    .min(1, { message: 'O estabelecimento deve ter no mínimo 1 mesa' })
    .max(200, { message: 'O limite inicial é de 200 mesas' }),
  orderMode: z.enum(['direct', 'waiter_approval'], {
    message: 'Modo de pedido inválido',
  }),
  openingDays: z
    .array(z.string())
    .min(1, { message: 'Selecione pelo menos um dia de funcionamento' }),
  openingTime: z
    .string()
    .regex(timeRegex, { message: 'Horário de abertura inválido (use HH:MM)' }),
  closingTime: z
    .string()
    .regex(timeRegex, { message: 'Horário de fechamento inválido (use HH:MM)' }),
});

export type OperationInput = z.input<typeof operationSchema>;
export type OperationOutput = z.output<typeof operationSchema>;

// Step 3: Subconta Bancária & Documentos (KYC)
export const subaccountSchema = z.object({
  repName: z
    .string()
    .trim()
    .min(3, { message: 'Nome do responsável deve ter pelo menos 3 caracteres' }),
  repCpf: z
    .string()
    .trim()
    .refine((val) => isValidCpf(val), {
      message: 'CPF do responsável inválido',
    })
    .transform((val) => val.replace(/\D/g, '')),
  repBirthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data de nascimento inválida (use AAAA-MM-DD)' }),
  bankCode: z.string().trim().min(1, { message: 'Selecione a instituição financeira' }),
  bankPixKey: z.string().trim().min(3, { message: 'Chave PIX é obrigatória' }),
  bankAgency: z.string().trim().min(1, { message: 'Agência é obrigatória' }),
  bankAccount: z.string().trim().min(1, { message: 'Conta é obrigatória' }),
  docIdKey: z.string().trim().min(1, { message: 'Documento de identificação (CNH/RG) é obrigatório' }),
  docCnpjKey: z.string().trim().min(1, { message: 'Cartão CNPJ ou Contrato Social é obrigatório' }),
});

export type SubaccountInput = z.input<typeof subaccountSchema>;
export type SubaccountOutput = z.output<typeof subaccountSchema>;
