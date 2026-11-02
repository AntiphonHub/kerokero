import { asaasRequest } from './client';
import { AsaasCustomer, AsaasCustomerInput } from './types';

export async function findAsaasCustomerByCpfCnpj(
  cpfCnpj: string,
): Promise<AsaasCustomer | null> {
  const clean = cpfCnpj.replace(/\D/g, '');
  try {
    const res = await asaasRequest<{ data: AsaasCustomer[] }>(`/customers?cpfCnpj=${clean}`);
    return res.data?.[0] || null;
  } catch {
    return null;
  }
}

export async function createAsaasCustomer(
  input: AsaasCustomerInput,
): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function createOrGetAsaasCustomer(
  input: AsaasCustomerInput,
): Promise<AsaasCustomer> {
  const existing = await findAsaasCustomerByCpfCnpj(input.cpfCnpj);
  if (existing) {
    return existing;
  }
  return createAsaasCustomer(input);
}
