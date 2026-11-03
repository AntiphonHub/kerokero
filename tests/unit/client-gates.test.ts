import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateClientLocation, joinTable } from '@/actions/client';
import { isValidTableToken, generateTableToken } from '@/lib/security/table-token';
import { isWithinIndoorRadius, type Coordinates } from '@/lib/security/geofence';
import { validateNickname, getGeolocationErrorMessage } from '@/components/client/gate-nickname';
import * as tablesDb from '@/lib/appwrite/tables';
import * as clientSessionsDb from '@/lib/appwrite/client-sessions';
import * as appwriteServer from '@/lib/appwrite/server';

// Mock cookies for next/headers
const mockCookieMap = new Map<string, string>();
const mockCookieSet = vi.fn((name: string, value: string) => {
  mockCookieMap.set(name, value);
});
const mockCookieDelete = vi.fn((name: string) => {
  mockCookieMap.delete(name);
});
const mockCookieGet = vi.fn((name: string) => {
  const val = mockCookieMap.get(name);
  return val !== undefined ? { name, value: val } : undefined;
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookieGet,
    set: mockCookieSet,
    delete: mockCookieDelete,
  })),
}));

// Mock Appwrite tables
vi.mock('@/lib/appwrite/tables', () => ({
  getTableByToken: vi.fn(),
  getTableById: vi.fn(),
}));

// Mock Appwrite client-sessions
vi.mock('@/lib/appwrite/client-sessions', () => ({
  joinTableSession: vi.fn(),
  getTableSession: vi.fn(),
  parseSessionParticipants: vi.fn((raw: any) => {
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }),
}));

// Mock Appwrite server & SDK
const mockGetDocument = vi.fn();
vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: vi.fn(() => ({
    databases: {
      getDocument: mockGetDocument,
    },
  })),
}));

describe('Client PWA Gates Unit Tests', () => {
  const validToken = generateTableToken();
  const mockTable = {
    $id: 'table_123',
    establishmentId: 'est_456',
    number: 7,
    label: 'Mesa 07',
    token: validToken,
    status: 'available',
    isActive: true,
  };

  const estCoords: Coordinates = {
    latitude: -23.55052,
    longitude: -46.633308,
  };

  const mockEstablishment = {
    $id: 'est_456',
    name: 'Santo Boteco',
    latitude: estCoords.latitude,
    longitude: estCoords.longitude,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieMap.clear();
  });

  describe('Nickname Validation Helper (validateNickname)', () => {
    it('accepts valid nicknames between 2 and 50 characters', () => {
      expect(validateNickname('Ana')).toEqual({ isValid: true, trimmed: 'Ana' });
      expect(validateNickname('Carlos Eduardo')).toEqual({ isValid: true, trimmed: 'Carlos Eduardo' });
      expect(validateNickname('Al')).toEqual({ isValid: true, trimmed: 'Al' });
      expect(validateNickname('   Bia   ')).toEqual({ isValid: true, trimmed: 'Bia' });
    });

    it('rejects empty or whitespace-only nicknames', () => {
      expect(validateNickname('')).toEqual({
        isValid: false,
        error: 'Informe um apelido com pelo menos 2 caracteres.',
      });
      expect(validateNickname('   ')).toEqual({
        isValid: false,
        error: 'Informe um apelido com pelo menos 2 caracteres.',
      });
    });

    it('rejects nicknames shorter than 2 characters', () => {
      expect(validateNickname('A')).toEqual({
        isValid: false,
        error: 'Informe um apelido com pelo menos 2 caracteres.',
      });
    });

    it('rejects nicknames longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      expect(validateNickname(longName)).toEqual({
        isValid: false,
        error: 'O apelido deve ter no máximo 50 caracteres.',
      });
    });
  });

  describe('Geolocation Error Guidance (getGeolocationErrorMessage)', () => {
    it('provides clear permission instructions for Safari and Chrome on PERMISSION_DENIED (code 1)', () => {
      const result = getGeolocationErrorMessage({ code: 1 });
      expect(result.title).toContain('negada');
      expect(result.instructions.ios).toContain('Safari');
      expect(result.instructions.android).toContain('Chrome');
    });

    it('provides GPS settings instructions on POSITION_UNAVAILABLE (code 2)', () => {
      const result = getGeolocationErrorMessage({ code: 2 });
      expect(result.title).toContain('indisponível');
      expect(result.instructions.ios).toContain('Localização');
      expect(result.instructions.android).toContain('GPS');
    });

    it('handles TIMEOUT (code 3) or unknown codes gracefully', () => {
      const result = getGeolocationErrorMessage({ code: 3 });
      expect(result.title).toContain('esgotado');
      expect(result.description).toContain('novamente');
    });
  });

  describe('Token Validation Rules', () => {
    it('accepts valid 48-char hex tokens', () => {
      expect(isValidTableToken(validToken)).toBe(true);
    });

    it('rejects invalid or malformed tokens', () => {
      expect(isValidTableToken('')).toBe(false);
      expect(isValidTableToken('short-token')).toBe(false);
      expect(isValidTableToken(null)).toBe(false);
      expect(isValidTableToken(undefined)).toBe(false);
      expect(isValidTableToken('z'.repeat(48))).toBe(false); // Non-hex chars
    });
  });

  describe('Geofence Coordinate Evaluation (250m Indoor Boundary)', () => {
    it('allows client within 250m radius of establishment', () => {
      // Offset of ~50 meters
      const clientCoords: Coordinates = {
        latitude: -23.55088,
        longitude: -46.633308,
      };
      expect(isWithinIndoorRadius(clientCoords, estCoords, 250)).toBe(true);
    });

    it('rejects client outside 250m radius (> 300m)', () => {
      // Offset of ~600 meters
      const farCoords: Coordinates = {
        latitude: -23.556,
        longitude: -46.633308,
      };
      expect(isWithinIndoorRadius(farCoords, estCoords, 250)).toBe(false);
    });

    it('rejects invalid coordinates gracefully', () => {
      expect(isWithinIndoorRadius(null as any, estCoords, 250)).toBe(false);
      expect(isWithinIndoorRadius({ latitude: NaN, longitude: 0 }, estCoords, 250)).toBe(false);
    });
  });

  describe('Gate 1: validateClientLocation Action Integration', () => {
    it('returns error when token is invalid', async () => {
      const res = await validateClientLocation('invalid-token');
      expect(res.success).toBe(false);
      expect(res.message).toContain('inválido');
    });

    it('returns error when table is inactive', async () => {
      vi.mocked(tablesDb.getTableByToken).mockResolvedValueOnce({
        ...mockTable,
        isActive: false,
      } as any);

      const res = await validateClientLocation(validToken);
      expect(res.success).toBe(false);
      expect(res.message).toContain('inativa');
    });

    it('returns error when client is outside 250m radius', async () => {
      vi.mocked(tablesDb.getTableByToken).mockResolvedValueOnce(mockTable as any);
      mockGetDocument.mockResolvedValueOnce(mockEstablishment);

      const farCoords: Coordinates = {
        latitude: -23.565,
        longitude: -46.633308,
      };

      const res = await validateClientLocation(validToken, farCoords);
      expect(res.success).toBe(false);
      expect(res.message).toContain('250m');
    });

    it('succeeds when client is within 250m radius', async () => {
      vi.mocked(tablesDb.getTableByToken).mockResolvedValueOnce(mockTable as any);
      mockGetDocument.mockResolvedValueOnce(mockEstablishment);

      const closeCoords: Coordinates = {
        latitude: -23.5506,
        longitude: -46.633308,
      };

      const res = await validateClientLocation(validToken, closeCoords);
      expect(res.success).toBe(true);
      expect(res.data?.tableNumber).toBe(7);
      expect(res.data?.establishmentName).toBe('Santo Boteco');
    });
  });

  describe('Gate 2: joinTable Action Integration', () => {
    it('rejects invalid nickname on entry', async () => {
      const res = await joinTable(validToken, ' ');
      expect(res.success).toBe(false);
      expect(res.message).toContain('2 e 50 caracteres');
    });

    it('succeeds with valid nickname and sets session cookie', async () => {
      vi.mocked(tablesDb.getTableByToken).mockResolvedValueOnce(mockTable as any);
      mockGetDocument.mockResolvedValueOnce(mockEstablishment);
      vi.mocked(clientSessionsDb.joinTableSession).mockResolvedValueOnce({
        session: {
          $id: 'session_999',
          establishmentId: 'est_456',
          tableId: 'table_123',
          tableNumber: 7,
          status: 'open',
          participants: '[]',
        } as any,
        participantId: 'p_1',
        participantName: 'Carlos',
      });

      const closeCoords: Coordinates = {
        latitude: -23.5506,
        longitude: -46.633308,
      };

      const res = await joinTable(validToken, 'Carlos', closeCoords);
      expect(res.success).toBe(true);
      expect(res.data?.participantName).toBe('Carlos');
      expect(mockCookieSet).toHaveBeenCalled();
    });
  });
});
