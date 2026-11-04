import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const happyHourSchema = z
  .object({
    happyHourEnabled: z.boolean().default(false),
    happyHourDays: z.array(z.string()).default([]),
    happyHourStartTime: z
      .string()
      .trim()
      .regex(timeRegex, { message: 'Horário de início inválido (use HH:MM)' })
      .optional()
      .nullable()
      .or(z.literal('')),
    happyHourEndTime: z
      .string()
      .trim()
      .regex(timeRegex, { message: 'Horário de término inválido (use HH:MM)' })
      .optional()
      .nullable()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.happyHourEnabled) {
      if (!data.happyHourDays || data.happyHourDays.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione ao menos um dia da semana para o Happy Hour',
          path: ['happyHourDays'],
        });
      }

      if (!data.happyHourStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Horário de início é obrigatório quando o Happy Hour está ativado',
          path: ['happyHourStartTime'],
        });
      }

      if (!data.happyHourEndTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Horário de término é obrigatório quando o Happy Hour está ativado',
          path: ['happyHourEndTime'],
        });
      }
    }
  });

export type HappyHourInput = z.input<typeof happyHourSchema>;
export type HappyHourOutput = z.output<typeof happyHourSchema>;
