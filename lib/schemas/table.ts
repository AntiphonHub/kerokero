import { z } from 'zod';

export const tableStatusSchema = z.enum([
  'idle',
  'occupied',
  'order_placed',
  'waiter_called',
  'bill_requested',
  'paid_pix',
]);

export type TableStatus = z.infer<typeof tableStatusSchema>;

export const createTableSchema = z.object({
  number: z
    .number()
    .int({ message: 'Número da mesa deve ser um inteiro' })
    .min(1, { message: 'O número da mesa deve ser no mínimo 1' })
    .max(999, { message: 'Número da mesa inválido' }),
  label: z
    .string()
    .trim()
    .min(1, { message: 'Rótulo da mesa é obrigatório' })
    .max(50, { message: 'Rótulo muito longo' }),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;

export const serviceCallTypeSchema = z.enum(['waiter', 'bill_card', 'custom']);

export const serviceCallSchema = z.object({
  tableId: z.string().trim().min(1, { message: 'ID da mesa é obrigatório' }),
  tableNumber: z.number().int().min(1),
  type: serviceCallTypeSchema,
  description: z.string().trim().max(255).optional(),
  requestedBy: z.string().trim().min(1).max(50),
});

export type ServiceCallInput = z.infer<typeof serviceCallSchema>;

export const printLayoutEnum = z.enum([
  'square',
  'compact_square',
  'vertical',
  'horizontal',
  '2x3',
  '3x3',
]);

export type PrintLayout = z.infer<typeof printLayoutEnum>;

export const printConfigSchema = z.object({
  layout: printLayoutEnum,
  cardsPerPage: z.number().int().min(1).max(20),
  bgColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Cor de fundo inválida (use formato hexadecimal)',
  }),
  textColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Cor de texto inválida (use formato hexadecimal)',
  }),
  customInstruction: z
    .string()
    .trim()
    .max(120, { message: 'Instrução muito longa' })
    .default('Aponte a câmera para fazer seu pedido e fechar a conta'),
});

export type PrintConfig = z.infer<typeof printConfigSchema>;
