import fs from 'fs';
import path from 'path';
import { AsaasErrorResponse } from './types';

export function getAsaasConfig() {
  const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
  let apiKey = process.env.ASAAS_API_KEY || '';

  // Fallback se o Next.js / dotenv-expand engoliu o '$' da chave
  if (!apiKey && typeof process !== 'undefined') {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('ASAAS_API_KEY=')) {
            const raw = trimmed.replace(/^ASAAS_API_KEY=/, '').trim();
            apiKey = raw.replace(/^["']|["']$/g, '');
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (apiKey.startsWith('\\$')) {
    apiKey = apiKey.substring(1);
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { access_token: apiKey } : {}),
    ...customHeaders,
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
    throw new Error(msg);
  }

  return data as T;
}
