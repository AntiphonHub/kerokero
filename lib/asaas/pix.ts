import { asaasRequest } from './client';
import { AsaasPixQrCode } from './types';

export interface CreatePixPaymentInput {
  customerName: string;
  customerCpf: string;
  value: number;
  description: string;
}

export interface CreatePixPaymentResult {
  paymentId: string;
  pixQrCodeBase64: string;
  pixCopyPaste: string;
  expirationDate: string;
}

export interface SubaccountPaymentStatus {
  status: string;
  isPaid: boolean;
}

export async function createPixPaymentOnSubaccount(
  subaccountApiKey: string,
  data: CreatePixPaymentInput,
): Promise<CreatePixPaymentResult> {
  const cleanCpf = data.customerCpf.replace(/\D/g, '');

  let customerId: string;

  try {
    const customer = await asaasRequest<{ id: string }>('/customers', {
      method: 'POST',
      headers: {
        access_token: subaccountApiKey,
      },
      body: JSON.stringify({
        name: data.customerName,
        cpfCnpj: cleanCpf,
      }),
    });
    customerId = customer.id;
  } catch (err: unknown) {
    const existing = await asaasRequest<{ data: Array<{ id: string }> }>(
      `/customers?cpfCnpj=${cleanCpf}`,
      {
        headers: {
          access_token: subaccountApiKey,
        },
      },
    );

    if (existing.data?.[0]?.id) {
      customerId = existing.data[0].id;
    } else {
      throw err;
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const payment = await asaasRequest<{ id: string }>('/payments', {
    method: 'POST',
    headers: {
      access_token: subaccountApiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: data.value,
      dueDate: today,
      description: data.description,
    }),
  });

  let pix: AsaasPixQrCode;

  try {
    pix = await asaasRequest<AsaasPixQrCode>(
      `/payments/${payment.id}/pixQrCode`,
      {
        headers: {
          access_token: subaccountApiKey,
        },
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('chave Pix cadastrada')) {
      // Subconta recém-criada pode levar alguns segundos para ativar a chave Pix.
      // Auto-provisiona chave aleatória (EVP) instantaneamente e retenta a emissão.
      try {
        await asaasRequest('/pix/addressKeys', {
          method: 'POST',
          headers: { access_token: subaccountApiKey },
          body: JSON.stringify({ type: 'EVP' }),
        });
      } catch {
        // Se a chave já estiver em provisionamento, segue para a retentativa
      }

      pix = await asaasRequest<AsaasPixQrCode>(
        `/payments/${payment.id}/pixQrCode`,
        {
          headers: {
            access_token: subaccountApiKey,
          },
        },
      );
    } else {
      throw err;
    }
  }

  return {
    paymentId: payment.id,
    pixQrCodeBase64: pix.encodedImage,
    pixCopyPaste: pix.payload,
    expirationDate: pix.expirationDate,
  };
}

export async function checkSubaccountPaymentStatus(
  subaccountApiKey: string,
  paymentId: string,
): Promise<SubaccountPaymentStatus> {
  const payment = await asaasRequest<{ id: string; status: string }>(
    `/payments/${paymentId}`,
    {
      headers: {
        access_token: subaccountApiKey,
      },
    },
  );

  const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED';

  return {
    status: payment.status,
    isPaid,
  };
}
