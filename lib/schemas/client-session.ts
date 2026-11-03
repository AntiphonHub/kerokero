import { z } from 'zod';

export const clientSessionSchema = z.object({
  participantId: z
    .string()
    .trim()
    .min(1, { message: 'ID do participante é obrigatório' }),
  participantName: z
    .string()
    .trim()
    .min(1, { message: 'Nome do participante é obrigatório' })
    .max(50, { message: 'Nome do participante muito longo' }),
  sessionId: z
    .string()
    .trim()
    .min(1, { message: 'ID da sessão é obrigatório' }),
  tableId: z
    .string()
    .trim()
    .min(1, { message: 'ID da mesa é obrigatório' }),
  establishmentId: z
    .string()
    .trim()
    .min(1, { message: 'ID do estabelecimento é obrigatório' }),
  createdAt: z
    .number()
    .int({ message: 'Timestamp deve ser inteiro' })
    .positive({ message: 'Timestamp de criação inválido' }),
});

export type ParticipantSessionPayload = z.infer<typeof clientSessionSchema>;
