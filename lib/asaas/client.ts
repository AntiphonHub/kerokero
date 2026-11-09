import fs from 'fs';
import path from 'path';
import { AsaasErrorResponse } from './types';

export function sanitizeAsaasApiKey(rawKey?: string | null): string {
  if (!rawKey) return '';
  let key = rawKey.trim();

  // Remove aspas duplas ou simples ao redor da chave (comum em dashboards e envs)
  key = key.replace(/^["']|["']$/g, '').trim();

  // Remove escapes de barra invertida (ex: \$aact_...)
  while (key.startsWith('\\$')) {
    key = key.substring(1);
  }

  // Se o Next.js / shell engoliu o '$' inicial por interpolação de variáveis e sobrou 'aact_...'
  if (key.startsWith('aact_')) {
    key = `$${key}`;
  }

  return key;
}

export function getAsaasConfig() {
  const apiUrl = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').trim();
  let apiKey = sanitizeAsaasApiKey(process.env.ASAAS_API_KEY);

  // Fallback em desenvolvimento local se o Next.js / dotenv engoliu a chave
  if (!apiKey && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('ASAAS_API_KEY=')) {
            const raw = trimmed.replace(/^ASAAS_API_KEY=/, '').trim();
            apiKey = sanitizeAsaasApiKey(raw);
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    apiKey,
  };
}

export async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { apiUrl, apiKey } = getAsaasConfig();
  const url = `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const customHeaders = (options.headers as Record<string, string> | undefined) || {};
  const tokenToUse = customHeaders.access_token
    ? sanitizeAsaasApiKey(customHeaders.access_token)
    : apiKey;

  if (!tokenToUse) {
    throw new Error(
      'Chave de API do Asaas não configurada (ASAAS_API_KEY ausente). Configure a variável de ambiente nas configurações do seu projeto.',
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
    access_token: tokenToUse,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorData = data as AsaasErrorResponse | null;
    const msg =
      errorData?.errors?.[0]?.description ||
      `Erro na requisição Asaas (status ${res.status})`;
    console.error(`[Asaas API Error] ${options.method || 'GET'} ${url} -> ${res.status}: ${msg}`);
    throw new Error(msg);
  }

  return data as T;
}
