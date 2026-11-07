'use server';

import { getLoggedInUser } from '@/lib/appwrite/session';
import {
  getEstablishmentByUserId,
  updateEstablishmentBankPixKey,
} from '@/lib/appwrite/establishments';
import {
  getSubaccountBalance,
  createSubaccountTransfer,
  listSubaccountTransfers,
} from '@/lib/asaas/transfers';
import { decryptSecret } from '@/lib/security/encryption';
import { AsaasTransfer } from '@/lib/asaas/types';

export interface WalletData {
  balance: number;
  availableBalance: number;
  bankPixKey?: string;
  bankCode?: string;
  bankAgency?: string;
  bankAccount?: string;
  repName?: string;
  establishmentName?: string;
  subaccountStatus?: string;
  transfers: AsaasTransfer[];
}

export interface WalletActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface RequestWithdrawalOptions {
  pixAddressKey?: string;
  pixAddressKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
}

/**
 * Consulta os dados da carteira do estabelecimento (saldo Asaas, dados bancários e histórico de transferências).
 */
export async function getWalletDataAction(): Promise<WalletActionResponse<WalletData>> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    if (!establishment.asaasSubaccountApiKey) {
      return {
        success: false,
        message: 'Conta de recebimentos não configurada para este estabelecimento.',
      };
    }

    const subaccountApiKey = decryptSecret(establishment.asaasSubaccountApiKey);

    const [balanceData, transfers] = await Promise.all([
      getSubaccountBalance(subaccountApiKey),
      listSubaccountTransfers(subaccountApiKey),
    ]);

    return {
      success: true,
      data: {
        balance: balanceData.balance,
        availableBalance: balanceData.availableBalance,
        bankPixKey: establishment.bankPixKey,
        bankCode: establishment.bankCode,
        bankAgency: establishment.bankAgency,
        bankAccount: establishment.bankAccount,
        repName: establishment.repName,
        establishmentName: establishment.name,
        subaccountStatus: establishment.subaccountStatus,
        transfers,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Wallet Action] Erro ao carregar carteira:', msg);
    return {
      success: false,
      message: 'Não foi possível carregar as informações financeiras. Tente novamente.',
    };
  }
}

/**
 * Solicita um saque instantâneo via PIX para a chave informada ou cadastrada do lojista.
 */
export async function requestWithdrawalAction(
  amount: number,
  options?: RequestWithdrawalOptions,
): Promise<WalletActionResponse<{ transferId: string; status: string; value: number }>> {
  try {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: 'O valor do saque deve ser maior que zero.',
      };
    }

    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    if (!establishment.asaasSubaccountApiKey) {
      return {
        success: false,
        message: 'Conta de recebimentos não configurada.',
      };
    }

    const pixAddressKey = options?.pixAddressKey?.trim() || establishment.bankPixKey;
    if (!pixAddressKey) {
      return {
        success: false,
        message: 'Informe a chave Pix para receber o saque.',
      };
    }

    const subaccountApiKey = decryptSecret(establishment.asaasSubaccountApiKey);

    // Checa saldo disponível em tempo real
    const currentBalance = await getSubaccountBalance(subaccountApiKey);
    if (amount > currentBalance.availableBalance) {
      return {
        success: false,
        message: `Saldo disponível insuficiente (Disponível: R$ ${currentBalance.availableBalance.toFixed(2)}).`,
      };
    }

    const transfer = await createSubaccountTransfer(subaccountApiKey, {
      value: amount,
      pixAddressKey,
      ...(options?.pixAddressKeyType ? { pixAddressKeyType: options.pixAddressKeyType } : {}),
      description: `Saque Bempedi - ${establishment.name}`,
    });

    // Se o usuário digitou uma nova chave Pix diferente da atual, salva como nova chave cadastrada
    if (options?.pixAddressKey && options.pixAddressKey.trim() !== establishment.bankPixKey) {
      try {
        await updateEstablishmentBankPixKey(establishment.$id, options.pixAddressKey.trim());
      } catch (err) {
        console.warn('[Wallet Action] Aviso ao atualizar chave Pix cadastrada:', err);
      }
    }

    return {
      success: true,
      message: 'Saque solicitado com sucesso!',
      data: {
        transferId: transfer.id,
        status: transfer.status,
        value: transfer.value,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Wallet Action] Erro ao solicitar saque:', msg);
    let userMsg = msg;
    if (/asaas/i.test(userMsg)) {
      userMsg = 'Falha ao processar a transferência. Verifique a chave Pix informada ou tente novamente mais tarde.';
    }
    return {
      success: false,
      message: userMsg || 'Falha ao processar o saque. Verifique seus dados bancários ou tente novamente mais tarde.',
    };
  }
}
