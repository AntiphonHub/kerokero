import crypto from 'node:crypto';

/**
 * Gera um token criptográfico aleatório com entropia segura para o QR Code da mesa.
 * 24 bytes em hex = 48 caracteres alfanuméricos hexadecimais imprevisíveis.
 */
export function generateTableToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Valida se uma string é um token de mesa válido (48 caracteres hexadecimais).
 */
export function isValidTableToken(token: unknown): boolean {
  if (typeof token !== 'string') return false;
  const hexRegex = /^[0-9a-fA-F]{48,}$/;
  return hexRegex.test(token.trim());
}
