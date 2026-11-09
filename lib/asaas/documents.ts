import { asaasRequest } from './client';
import { AsaasDocumentGroup, AsaasAccountStatus } from './types';

/**
 * Consulta a situação cadastral geral da subconta (comercial, bancária, documentação).
 * Endpoint: GET /v3/myAccount/status
 */
export async function getMyAccountStatus(
  subaccountApiKey: string,
): Promise<AsaasAccountStatus | null> {
  try {
    return await asaasRequest<AsaasAccountStatus>('/myAccount/status', {
      headers: {
        access_token: subaccountApiKey,
      },
    });
  } catch (error) {
    console.warn('[Asaas Documents] Falha ao consultar status da subconta:', error);
    return null;
  }
}

/**
 * Consulta a lista dinâmica de documentos e pendências cadastrais da subconta.
 * Utiliza o endpoint oficial GET /v3/myAccount/documents com a API Key da subconta.
 */
export async function getMyAccountDocuments(
  subaccountApiKey: string,
): Promise<AsaasDocumentGroup[]> {
  try {
    const res = await asaasRequest<{ data?: AsaasDocumentGroup[] } | AsaasDocumentGroup[]>(
      '/myAccount/documents',
      {
        headers: {
          access_token: subaccountApiKey,
        },
      },
    );

    if (Array.isArray(res)) {
      return res;
    }

    if (res && Array.isArray(res.data)) {
      return res.data;
    }

    return [];
  } catch (error) {
    console.warn('[Asaas Documents] Falha ao consultar documentos da subconta:', error);
    return [];
  }
}

/**
 * Obtém a URL do fluxo oficial de onboarding do Asaas (reconhecimento facial / selfie e upload).
 * Se algum grupo de documentos pendente contiver a `onboardingUrl`, retorna o link para redirecionamento.
 */
export async function getMyAccountOnboardingUrl(
  subaccountApiKey: string,
): Promise<string | null> {
  const documents = await getMyAccountDocuments(subaccountApiKey);

  for (const doc of documents) {
    if (doc.onboardingUrl && doc.status !== 'APPROVED') {
      return doc.onboardingUrl;
    }
  }

  return null;
}

/**
 * Envia um arquivo para um grupo de documentos da subconta via API (modelo BaaS / multipart).
 * Endpoint: POST /v3/myAccount/documents/{groupId}
 */
export async function uploadSubaccountDocument(
  subaccountApiKey: string,
  groupId: string,
  fileBlob: Blob,
  fileName: string,
): Promise<{ id: string; status: string }> {
  const baseUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
  const url = `${baseUrl}/myAccount/documents/${groupId}`;

  const formData = new FormData();
  formData.append('file', fileBlob, fileName);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      access_token: subaccountApiKey,
      'User-Agent': 'Bempedi/1.0.0',
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.errors && errJson.errors[0]?.description) {
        parsedMsg = errJson.errors[0].description;
      }
    } catch {
      // fallback to raw text
    }
    throw new Error(parsedMsg || 'Erro ao enviar documento para o Asaas.');
  }

  return await res.json();
}

