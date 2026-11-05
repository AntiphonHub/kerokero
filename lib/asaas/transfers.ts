import { asaasRequest } from './client';
import { AsaasBalance, AsaasTransfer, CreateTransferInput } from './types';

/**
 * Consulta o saldo financeiro da subconta (saldo total e saldo disponível para saque).
 */
export async function getSubaccountBalance(
  subaccountApiKey: string,
): Promise<AsaasBalance> {
  const data = await asaasRequest<AsaasBalance>('/finance/balance', {
    headers: {
      access_token: subaccountApiKey,
    },
  });

  const balance = Number(data.balance || 0);
  const availableBalance = Number(
    data.availableBalance !== undefined && data.availableBalance !== null
      ? data.availableBalance
      : balance,
  );

  return {
    balance,
    availableBalance,
  };
}

/**
 * Realiza uma transferência / saque via PIX a partir da subconta do Asaas.
 */
export async function createSubaccountTransfer(
  subaccountApiKey: string,
  input: CreateTransferInput,
): Promise<AsaasTransfer> {
  const payload: Record<string, unknown> = {
    value: input.value,
    operationType: 'PIX',
    ...(input.pixAddressKey ? { pixAddressKey: input.pixAddressKey } : {}),
    ...(input.pixAddressKeyType ? { pixAddressKeyType: input.pixAddressKeyType } : {}),
    ...(input.description ? { description: input.description } : {}),
  };

  return await asaasRequest<AsaasTransfer>('/transfers', {
    method: 'POST',
    headers: {
      access_token: subaccountApiKey,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Lista as transferências e saques mais recentes realizados pela subconta.
 */
export async function listSubaccountTransfers(
  subaccountApiKey: string,
  limit = 20,
): Promise<AsaasTransfer[]> {
  const res = await asaasRequest<{ data: AsaasTransfer[]; totalCount: number }>(
    `/transfers?limit=${limit}&order=desc`,
    {
      headers: {
        access_token: subaccountApiKey,
      },
    },
  );

  return res.data || [];
}
