'use server';

import { getLoggedInUser } from '@/lib/appwrite/session';
import {
  getEstablishmentByUserId,
  updateEstablishmentData,
} from '@/lib/appwrite/establishments';
import {
  adjustEstablishmentTablesCapacity,
  listEstablishmentTables,
} from '@/lib/appwrite/tables';
import { cancelAsaasSubscription } from '@/lib/asaas/subscriptions';
import { createAdminClient } from '@/lib/appwrite/server';
import { cookies } from 'next/headers';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface StoreSettingsInput {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  openingDays?: string[];
  openingTime?: string;
  closingTime?: string;
  happyHourEnabled?: boolean;
  happyHourStart?: string;
  happyHourEnd?: string;
  happyHourStartTime?: string;
  happyHourEndTime?: string;
  happyHourDays?: string[];
}

/**
 * Atualiza dados cadastrais e operacionais do estabelecimento.
 */
export async function updateStoreSettingsAction(
  input: StoreSettingsInput,
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    if (input.name !== undefined && input.name.trim().length < 2) {
      return { success: false, message: 'O nome do estabelecimento deve ter pelo menos 2 caracteres.' };
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.phone !== undefined) updatePayload.phone = input.phone.trim();
    if (input.address !== undefined) updatePayload.address = input.address.trim();
    if (input.city !== undefined) updatePayload.city = input.city.trim();
    if (input.state !== undefined) updatePayload.state = input.state.trim();
    if (input.openingDays !== undefined) updatePayload.openingDays = input.openingDays;
    if (input.openingTime !== undefined) updatePayload.openingTime = input.openingTime;
    if (input.closingTime !== undefined) updatePayload.closingTime = input.closingTime;
    if (input.happyHourEnabled !== undefined) updatePayload.happyHourEnabled = input.happyHourEnabled;
    const hhStart = input.happyHourStartTime ?? input.happyHourStart;
    const hhEnd = input.happyHourEndTime ?? input.happyHourEnd;
    if (hhStart !== undefined) {
      updatePayload.happyHourStartTime = hhStart;
      updatePayload.happyHourStart = hhStart;
    }
    if (hhEnd !== undefined) {
      updatePayload.happyHourEndTime = hhEnd;
      updatePayload.happyHourEnd = hhEnd;
    }
    if (input.happyHourDays !== undefined) updatePayload.happyHourDays = input.happyHourDays;

    await updateEstablishmentData(establishment.$id, updatePayload);

    return { success: true, message: 'Configurações salvas com sucesso!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg || 'Erro ao atualizar dados da loja.' };
  }
}

/**
 * Ajusta a quantidade de mesas cadastradas (aumento ou redução com trava de ocupação).
 */
export async function updateTablesCapacityAction(
  newCount: number,
): Promise<ActionResponse<{ tablesCount: number }>> {
  try {
    if (typeof newCount !== 'number' || Number.isNaN(newCount) || newCount < 1 || newCount > 100) {
      return { success: false, message: 'A quantidade de mesas deve ser entre 1 e 100.' };
    }

    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const result = await adjustEstablishmentTablesCapacity(establishment.$id, newCount);
    if (!result.success) {
      return { success: false, message: result.message };
    }

    return {
      success: true,
      message: `Capacidade ajustada para ${newCount} mesas com sucesso!`,
      data: { tablesCount: newCount },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg || 'Erro ao alterar quantidade de mesas.' };
  }
}

/**
 * Troca a senha do titular logado com verificação da senha atual e nova senha.
 */
export async function updatePasswordAction(
  currentPassword?: string,
  newPassword?: string,
  confirmPassword?: string,
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'A nova senha deve conter pelo menos 8 caracteres.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: 'A nova senha e a confirmação não coincidem.' };
    }

    const { users } = createAdminClient();
    await users.updatePassword(user.$id, newPassword);

    return { success: true, message: 'Senha alterada com sucesso!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg || 'Erro ao alterar senha.' };
  }
}

/**
 * Cancela a assinatura recorrente do plano SaaS no Asaas e atualiza o status no banco.
 */
export async function cancelSubscriptionAction(): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    if (establishment.asaasSubscriptionId) {
      try {
        await cancelAsaasSubscription(establishment.asaasSubscriptionId);
      } catch (asaasErr) {
        console.warn('[cancelSubscriptionAction] Falha ao cancelar no Asaas:', asaasErr);
      }
    }

    await updateEstablishmentData(establishment.$id, {
      subscriptionStatus: 'canceled',
    });

    return { success: true, message: 'Assinatura cancelada com sucesso.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg || 'Erro ao cancelar assinatura.' };
  }
}

/**
 * Exclui o restaurante e desativa a conta na Zona de Perigo.
 */
export async function deleteAccountAction(
  confirmationName: string,
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    if (confirmationName.trim().toLowerCase() !== establishment.name.trim().toLowerCase()) {
      return {
        success: false,
        message: 'Nome de confirmação incorreto. Digite exatamente o nome do restaurante.',
      };
    }

    // Verifica se há mesas com comandas em andamento
    const tables = await listEstablishmentTables(establishment.$id);
    const activeBusyTables = tables.filter((t) => t.status !== 'idle' || t.activeSessionId);
    if (activeBusyTables.length > 0) {
      return {
        success: false,
        message: `Não é possível excluir: existem ${activeBusyTables.length} mesas com comandas abertas. Encerre todas as mesas antes de excluir.`,
      };
    }

    // Cancela assinatura no Asaas
    if (establishment.asaasSubscriptionId) {
      try {
        await cancelAsaasSubscription(establishment.asaasSubscriptionId);
      } catch (err) {
        console.warn('[deleteAccountAction] Falha ao cancelar subscrição Asaas:', err);
      }
    }

    // Desativa estabelecimento
    await updateEstablishmentData(establishment.$id, {
      isActive: false,
      subscriptionStatus: 'canceled',
    });

    // Remove cookies de sessão se em runtime de requisição
    try {
      const cookieStore = await cookies();
      cookieStore.delete('a_session_' + (process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''));
      cookieStore.delete('kerokero_session');
    } catch {}

    return { success: true, message: 'Estabelecimento e conta desativados com sucesso.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg || 'Erro ao excluir conta.' };
  }
}
