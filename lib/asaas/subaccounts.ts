import { asaasRequest } from './client';
import { AsaasSubaccount, AsaasSubaccountInput } from './types';

export async function createAsaasSubaccount(
  input: AsaasSubaccountInput,
): Promise<AsaasSubaccount> {
  // Extrai número e bairro se o endereço veio em texto corrido (ex: "Rua Tal, 123 - Centro")
  let address = input.address || 'Rua Principal';
  let addressNumber = input.addressNumber || 'SN';
  let province = input.province || 'Centro';

  if (!input.addressNumber && input.address?.includes(',')) {
    const [streetPart, restPart] = input.address.split(',', 2);
    address = streetPart.trim();
    if (restPart) {
      const numMatch = restPart.match(/\s*(\d+[a-zA-Z]?)/);
      if (numMatch) {
        addressNumber = numMatch[1];
      }
      if (restPart.includes('-')) {
        const [, neighborhood] = restPart.split('-', 2);
        if (neighborhood && neighborhood.trim()) {
          province = neighborhood.trim();
        }
      }
    }
  }

  const payload = {
    name: input.name,
    email: input.email,
    cpfCnpj: input.cpfCnpj.replace(/\D/g, ''),
    companyType: input.companyType || 'LIMITED',
    phone: input.phone?.replace(/\D/g, ''),
    mobilePhone: (input.mobilePhone || input.phone)?.replace(/\D/g, ''),
    incomeValue: input.incomeValue || 25000.0,
    address,
    addressNumber,
    complement: input.complement,
    province,
    postalCode: input.postalCode?.replace(/\D/g, ''),
  };

  try {
    return await asaasRequest<AsaasSubaccount>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // Se o email já está em uso na conta Asaas (comum quando o lojista usa o email da conta mestre no Sandbox)
    if (msg.includes('já está em uso') && input.email.includes('@')) {
      const [userPart, domainPart] = input.email.split('@');
      const suffix = input.cpfCnpj.replace(/\D/g, '').slice(-4) || 'sub';
      const aliasEmail = `${userPart}+sub${suffix}@${domainPart}`;

      console.log(`[Asaas Subaccount] Email original em uso (${input.email}). Tentando criar subconta com alias (${aliasEmail})...`);

      return await asaasRequest<AsaasSubaccount>('/accounts', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          email: aliasEmail,
        }),
      });
    }

    throw err;
  }
}
