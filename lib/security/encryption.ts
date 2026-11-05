import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX_V2 = 'enc:v2:';
const PREFIX_V1 = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.APPWRITE_API_KEY ||
    process.env.ASAAS_API_KEY ||
    'kerokero-default-dev-secret-key-salt';

  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Verifica se uma string está em formato cifrado (v1 ou v2).
 */
export function isEncryptedSecret(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith(PREFIX_V2) || value.startsWith(PREFIX_V1);
}

/**
 * Criptografa uma credencial ou segredo usando AES-256-GCM.
 * Utiliza empacotamento binário compacto (12 bytes IV + 16 bytes AuthTag + Ciphertext)
 * codificado em base64url com prefixo 'enc:v2:'.
 * 
 * Isso garante que chaves de API (mesmo longas, de ~100 caracteres) resultem em strings
 * de ~160 a 180 caracteres, respeitando com folga o limite de 255 caracteres do Appwrite.
 */
export function encryptSecret(plainText?: string | null): string {
  if (!plainText || typeof plainText !== 'string') {
    return '';
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag(); // 16 bytes

  // Empacota IV (12B) + Tag (16B) + Cifrado em um único buffer compacto
  const combined = Buffer.concat([iv, tag, encrypted]);

  return `${PREFIX_V2}${combined.toString('base64url')}`;
}

/**
 * Descriptografa um segredo cifrado com AES-256-GCM.
 * Suporta o formato compacto atual (enc:v2:), o formato anterior (enc:v1:),
 * ou texto plano legado caso o dado não tenha sido criptografado.
 */
export function decryptSecret(cipherText?: string | null): string {
  if (!cipherText || typeof cipherText !== 'string') {
    return '';
  }

  // Formato compacto v2 (Base64URL)
  if (cipherText.startsWith(PREFIX_V2)) {
    const rawBase64 = cipherText.slice(PREFIX_V2.length);
    const combined = Buffer.from(rawBase64, 'base64url');

    if (combined.length < 28) {
      throw new Error('Dado criptografado corrompido ou truncado.');
    }

    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(12, 28);
    const data = combined.subarray(28);

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  // Formato legado v1 (Hex separado por dois pontos)
  if (cipherText.startsWith(PREFIX_V1)) {
    const parts = cipherText.slice(PREFIX_V1.length).split(':');
    if (parts.length !== 3) {
      throw new Error('Formato inválido de dado criptografado.');
    }

    const [ivHex, tagHex, dataHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  // Texto plano legado
  return cipherText;
}
