'use server';

import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import {
  listKitchenOrders,
  getOrderById,
  updateOrderStatus,
  batchUpdateOrdersStatus,
  OrderDocument,
  OrderStatus,
} from '@/lib/appwrite/orders';
import {
  updateOrderStatusSchema,
  batchUpdateOrdersStatusSchema,
} from '@/lib/schemas/kds';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Busca a fila de pedidos ativos da cozinha do estabelecimento do usuário autenticado.
 */
export async function getKitchenOrdersAction(): Promise<{
  success: boolean;
  message?: string;
  orders?: OrderDocument[];
}> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const orders = await listKitchenOrders(establishment.$id);
    return {
      success: true,
      orders,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[KDS Action] Erro ao carregar pedidos da cozinha:', msg);
    return { success: false, message: msg || 'Erro ao carregar pedidos da cozinha.' };
  }
}

/**
 * Atualiza o status de um pedido na cozinha (pending -> preparing -> ready -> delivered).
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResponse<OrderDocument>> {
  try {
    const parsed = updateOrderStatusSchema.safeParse({ orderId, status });
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || 'Dados inválidos.' };
    }

    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const order = await getOrderById(orderId);
    if (!order || order.establishmentId !== establishment.$id) {
      return { success: false, message: 'Pedido não encontrado ou não pertence a este estabelecimento.' };
    }

    const updated = await updateOrderStatus(orderId, status);
    return {
      success: true,
      data: updated,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[KDS Action] Erro ao atualizar status do pedido:', msg);
    return { success: false, message: msg || 'Erro ao atualizar pedido.' };
  }
}

/**
 * Atualiza múltiplos pedidos em lote para um novo status (ex: avançar todos os pedidos de uma mesa).
 */
export async function batchUpdateOrdersStatusAction(
  orderIds: string[],
  status: OrderStatus,
): Promise<{
  success: boolean;
  message?: string;
  updatedCount?: number;
}> {
  try {
    const parsed = batchUpdateOrdersStatusSchema.safeParse({ orderIds, status });
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || 'Dados inválidos.' };
    }

    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const updatedCount = await batchUpdateOrdersStatus(establishment.$id, orderIds, status);
    return {
      success: true,
      updatedCount,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[KDS Action] Erro ao atualizar pedidos em lote:', msg);
    return { success: false, message: msg || 'Erro ao atualizar pedidos em lote.' };
  }
}
