import crypto from 'node:crypto';
import {
  clientSessionSchema,
  type ParticipantSessionPayload,
} from '@/lib/schemas/client-session';

export const PARTICIPANT_COOKIE_NAME = 'kerokero_participant';
export type { ParticipantSessionPayload };

// Validade padrão da sessão: 24 horas (em ms)
export const DEFAULT_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Tolerância máxima para clock skew no futuro: 60 segundos (em ms)
export const MAX_CLOCK_SKEW_MS = 60 * 1000;

export type ParticipantSessionInput = Omit<ParticipantSessionPayload, 'createdAt'> & {
  createdAt?: number;
};

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.APPWRITE_API_KEY ||
    'kerokero-participant-session-dev-secret-key'
  );
}

/**
 * Gera um token de sessão assinado com HMAC-SHA256 para o participante da mesa.
 */
export async function generateParticipantToken(
  payload: ParticipantSessionPayload | ParticipantSessionInput
): Promise<string> {
  const fullPayload: ParticipantSessionPayload = {
    ...payload,
    createdAt: payload.createdAt ?? Date.now(),
  };

  const validated = clientSessionSchema.parse(fullPayload);
  const secret = getSessionSecret();

  const payloadBuffer = Buffer.from(JSON.stringify(validated), 'utf-8');
  const encodedPayload = payloadBuffer.toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifica e decodifica um token de sessão de participante.
 * Retorna o payload validado se o token for autêntico e não expirado, ou null caso contrário.
 */
export async function verifyParticipantToken(
  token: string,
  maxAgeMs: number = DEFAULT_SESSION_MAX_AGE_MS
): Promise<ParticipantSessionPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const parsed = clientSessionSchema.safeParse(JSON.parse(payloadJson));

    if (!parsed.success) {
      return null;
    }

    const now = Date.now();
    // Expiration check
    if (now - parsed.data.createdAt > maxAgeMs) {
      return null;
    }

    // Future clock skew protection (token cannot be from the future beyond tolerance)
    if (parsed.data.createdAt > now + MAX_CLOCK_SKEW_MS) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
