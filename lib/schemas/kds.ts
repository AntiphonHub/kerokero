import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
]);

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
  status: orderStatusSchema,
});

export const batchUpdateOrdersStatusSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, 'Nenhum pedido fornecido para atualização'),
  status: orderStatusSchema,
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type BatchUpdateOrdersStatusInput = z.infer<typeof batchUpdateOrdersStatusSchema>;
