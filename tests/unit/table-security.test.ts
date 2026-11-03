import { describe, it, expect } from 'vitest';
import { generateTableToken, isValidTableToken } from '@/lib/security/table-token';
import { calculateDistanceMeters, isWithinIndoorRadius } from '@/lib/security/geofence';
import {
  tableStatusSchema,
  createTableSchema,
  serviceCallSchema,
  printConfigSchema,
} from '@/lib/schemas/table';

describe('Table Security & Tokens', () => {
  it('generates a secure cryptographically random token with minimum 48 hex chars', () => {
    const token = generateTableToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(48);
    expect(isValidTableToken(token)).toBe(true);
  });

  it('rejects invalid or tampered tokens', () => {
    expect(isValidTableToken('')).toBe(false);
    expect(isValidTableToken('abc')).toBe(false);
    expect(isValidTableToken('invalid-characters-xyz-not-hex-long-enough-1234567890abcdef')).toBe(false);
  });
});

describe('Indoor Geofencing (100% Indoor Enforcement)', () => {
  // Coordenadas de referência (Exemplo: restaurante na Av. Paulista, SP)
  const establishmentCoords = {
    latitude: -23.561414,
    longitude: -46.655881,
  };

  it('allows access when user is within 250m radius (inside establishment)', () => {
    // Cliente a ~50 metros de distância
    const clientCoords = {
      latitude: -23.561700,
      longitude: -46.655600,
    };

    const distance = calculateDistanceMeters(clientCoords, establishmentCoords);
    expect(distance).toBeLessThan(250);
    expect(isWithinIndoorRadius(clientCoords, establishmentCoords, 250)).toBe(true);
  });

  it('strictly blocks access when user is outside the 250m radius (e.g. at home)', () => {
    // Cliente a ~1.2 km de distância
    const clientCoords = {
      latitude: -23.550520,
      longitude: -46.655881,
    };

    const distance = calculateDistanceMeters(clientCoords, establishmentCoords);
    expect(distance).toBeGreaterThan(250);
    expect(isWithinIndoorRadius(clientCoords, establishmentCoords, 250)).toBe(false);
  });

  it('blocks access if client coordinates are missing or invalid', () => {
    expect(isWithinIndoorRadius(null as unknown as { latitude: number; longitude: number }, establishmentCoords)).toBe(false);
    expect(isWithinIndoorRadius({ latitude: NaN, longitude: -46.65 } as any, establishmentCoords)).toBe(false);
  });
});

describe('Table Schemas (Zod)', () => {
  it('validates supported table statuses', () => {
    expect(tableStatusSchema.safeParse('idle').success).toBe(true);
    expect(tableStatusSchema.safeParse('occupied').success).toBe(true);
    expect(tableStatusSchema.safeParse('order_placed').success).toBe(true);
    expect(tableStatusSchema.safeParse('waiter_called').success).toBe(true);
    expect(tableStatusSchema.safeParse('bill_requested').success).toBe(true);
    expect(tableStatusSchema.safeParse('paid_pix').success).toBe(true);
    expect(tableStatusSchema.safeParse('unknown_status').success).toBe(false);
  });

  it('validates createTable input', () => {
    const valid = createTableSchema.safeParse({
      number: 1,
      label: 'Mesa 01',
    });
    expect(valid.success).toBe(true);

    const invalid = createTableSchema.safeParse({
      number: 0,
      label: '',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates serviceCall input', () => {
    const valid = serviceCallSchema.safeParse({
      tableId: 'tab_123',
      tableNumber: 5,
      type: 'waiter',
      description: 'Trazer mais gelo',
      requestedBy: 'Carlos',
    });
    expect(valid.success).toBe(true);
  });

  it('validates print layout options and color codes', () => {
    const valid = printConfigSchema.safeParse({
      layout: '2x3',
      cardsPerPage: 6,
      bgColor: '#FFFFFF',
      textColor: '#121212',
      customInstruction: 'Aponte a câmera para pedir',
    });
    expect(valid.success).toBe(true);

    const invalid = printConfigSchema.safeParse({
      layout: 'invalid',
      cardsPerPage: 100,
    });
    expect(invalid.success).toBe(false);
  });
});
