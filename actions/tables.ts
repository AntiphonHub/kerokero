'use server';

import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import {
  ensureEstablishmentTables,
  resolveServiceCall,
  resetTableSession,
  getTableById,
  listTableServiceCalls,
  TableDocument,
  ServiceCallDocument,
} from '@/lib/appwrite/tables';
import { TableStatus } from '@/lib/schemas/table';
import {
  closeAndSettleEntireTableSession,
  type TableSessionDocument,
} from '@/lib/appwrite/client-sessions';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Garante a sincronização e geração das mesas do estabelecimento com base no `tablesCount` cadastrado.
 */
export async function syncTablesAction(): Promise<{
  success: boolean;
  message?: string;
  count?: number;
  tables?: TableDocument[];
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

    const count = establishment.tablesCount || 10;
    const tables = await ensureEstablishmentTables(establishment.$id, count);

    return {
      success: true,
      count: tables.length,
      tables,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Tables Action] Erro ao sincronizar mesas:', msg);
    return { success: false, message: msg || 'Erro ao sincronizar mesas.' };
  }
}

/**
 * Conclui um chamado de serviço (garçom ou maquininha) da mesa.
 */
export async function resolveServiceCallAction(
  callId: string,
  tableId: string,
  fallbackStatus: TableStatus = 'occupied',
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    await resolveServiceCall(callId, tableId, fallbackStatus);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Tables Action] Erro ao resolver chamado:', msg);
    return { success: false, message: msg || 'Erro ao atender chamado.' };
  }
}

/**
 * Reseta o status da mesa para `idle` e fecha a comanda em aberto.
 */
export async function resetTableAction(tableId: string): Promise<ActionResponse<TableDocument>> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const table = await resetTableSession(tableId);
    return { success: true, data: table };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Tables Action] Erro ao resetar mesa:', msg);
    return { success: false, message: msg || 'Erro ao liberar mesa.' };
  }
}

/**
 * Carrega os detalhes completos de uma mesa e seus chamados pendentes.
 */
export async function getTableDetailsAction(tableId: string): Promise<{
  success: boolean;
  message?: string;
  table?: TableDocument | null;
  serviceCalls?: ServiceCallDocument[];
}> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const table = await getTableById(tableId);
    if (!table || table.establishmentId !== establishment.$id) {
      return { success: false, message: 'Mesa não encontrada.' };
    }

    const serviceCalls = await listTableServiceCalls(tableId);

    return {
      success: true,
      table,
      serviceCalls,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg || 'Erro ao carregar detalhes da mesa.' };
  }
}


/**
 * Quita a comanda e encerra a sessão da mesa (ex: garçom marcou como pago na maquininha).
 */
export async function settleAndCloseTableAction(
  tableId: string,
  paymentMethod: 'pos_card' | 'cash' = 'pos_card',
): Promise<ActionResponse<{ table: TableDocument; session: TableSessionDocument | null }>> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const table = await getTableById(tableId);
    if (!table || table.establishmentId !== establishment.$id) {
      return { success: false, message: 'Mesa não encontrada ou não pertence ao seu restaurante.' };
    }

    const result = await closeAndSettleEntireTableSession(tableId, paymentMethod);

    return {
      success: true,
      message: 'Comanda quitada e mesa liberada com sucesso!',
      data: result,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Tables Action] Erro ao quitar comanda:', msg);
    return { success: false, message: msg || 'Erro ao quitar comanda da mesa.' };
  }
}
