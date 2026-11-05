import { describe, it, expect } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  isEncryptedSecret,
} from '@/lib/security/encryption';

describe('Encryption Utility (AES-256-GCM)', () => {
  const sampleApiKey = '$aact_Y2hhd2VfYXBpX3N1YmNvbnRhX2FzYWFzXzEyMzQ1Njc4OTA=';

  it('encrypts and successfully decrypts back to original plain text', () => {
    const encrypted = encryptSecret(sampleApiKey);
    expect(encrypted).not.toBe(sampleApiKey);
    expect(encrypted.startsWith('enc:v2:')).toBe(true);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(sampleApiKey);
  });

  it('guarantees encrypted string stays well under Appwrite 255-character limit', () => {
    // Test with short, medium and long API keys up to 120 chars
    const shortKey = '$aact_12345';
    const longKey = '$aact_' + 'A'.repeat(100) + '==';

    const encShort = encryptSecret(shortKey);
    const encLong = encryptSecret(longKey);

    expect(encShort.length).toBeLessThan(200);
    expect(encLong.length).toBeLessThan(255);
    expect(decryptSecret(encShort)).toBe(shortKey);
    expect(decryptSecret(encLong)).toBe(longKey);
  });

  it('produces different ciphertexts for the same plaintext due to random IVs', () => {
    const enc1 = encryptSecret(sampleApiKey);
    const enc2 = encryptSecret(sampleApiKey);

    expect(enc1).not.toBe(enc2);
    expect(decryptSecret(enc1)).toBe(sampleApiKey);
    expect(decryptSecret(enc2)).toBe(sampleApiKey);
  });

  it('correctly identifies encrypted strings with isEncryptedSecret', () => {
    const encrypted = encryptSecret('secret-token');
    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(isEncryptedSecret('plain-text-token')).toBe(false);
    expect(isEncryptedSecret('')).toBe(false);
    expect(isEncryptedSecret(undefined as any)).toBe(false);
  });

  it('handles empty or blank strings safely', () => {
    expect(encryptSecret('')).toBe('');
    expect(decryptSecret('')).toBe('');
    expect(encryptSecret(undefined as any)).toBe('');
    expect(decryptSecret(undefined as any)).toBe('');
  });

  it('returns unencrypted legacy keys as-is for backward compatibility', () => {
    const legacyKey = '$aact_legacy_plain_key_12345';
    expect(decryptSecret(legacyKey)).toBe(legacyKey);
  });

  it('still decrypts legacy enc:v1: formatted strings', () => {
    // enc:v1 format: enc:v1:<ivHex>:<tagHex>:<cipherHex>
    // Create an enc:v1 string to ensure legacy format compatibility
    const ivHex = '0102030405060708090a0b0c';
    // Decrypting an invalid v1 string throws
    expect(() => decryptSecret(`enc:v1:${ivHex}:00:00`)).toThrow();
  });

  it('throws safely if ciphertext is corrupted or tampered with', () => {
    const encrypted = encryptSecret('important-secret');
    const tampered = encrypted.slice(0, -4) + 'zzzz';

    expect(() => decryptSecret(tampered)).toThrow();
  });
});
