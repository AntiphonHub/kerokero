import { describe, it, expect } from 'vitest';
import { getEstablishmentInitials, isRouteActive, formatTablesCount } from '@/lib/utils/sidebar';

describe('Sidebar Utilities', () => {
  describe('getEstablishmentInitials', () => {
    it('returns initials for two words', () => {
      expect(getEstablishmentInitials('My Bar')).toBe('MB');
      expect(getEstablishmentInitials('Kero Kero')).toBe('KK');
    });

    it('returns initials for multi-word establishment names', () => {
      expect(getEstablishmentInitials('Santo Boteco Petiscaria')).toBe('SB');
      expect(getEstablishmentInitials('Café & Bistrô')).toBe('CB');
      expect(getEstablishmentInitials('São João Pizzas')).toBe('SJ');
      expect(getEstablishmentInitials('Açaí Retrô Express')).toBe('AR');
    });

    it('handles single word by taking first two letters', () => {
      expect(getEstablishmentInitials('KeroKero')).toBe('KE');
      expect(getEstablishmentInitials('Lanchonete')).toBe('LA');
      expect(getEstablishmentInitials('bar')).toBe('BA');
    });

    it('handles single character name', () => {
      expect(getEstablishmentInitials('B')).toBe('B');
    });

    it('handles empty, null or undefined gracefully with fallback KK', () => {
      expect(getEstablishmentInitials('')).toBe('KK');
      expect(getEstablishmentInitials('   ')).toBe('KK');
      expect(getEstablishmentInitials(null)).toBe('KK');
      expect(getEstablishmentInitials(undefined)).toBe('KK');
    });

    it('ignores extra spaces and punctuation', () => {
      expect(getEstablishmentInitials('   Gourmet   Grill  ')).toBe('GG');
      expect(getEstablishmentInitials('Bar & Restaurante')).toBe('BR');
      expect(getEstablishmentInitials('100% Burguer')).toBe('1B');
    });
  });

  describe('formatTablesCount', () => {
    it('formats 1 table correctly as singular', () => {
      expect(formatTablesCount(1)).toBe('1 mesa');
    });

    it('formats multiple tables as plural', () => {
      expect(formatTablesCount(10)).toBe('10 mesas');
      expect(formatTablesCount(25)).toBe('25 mesas');
      expect(formatTablesCount(100)).toBe('100 mesas');
    });

    it('formats 0 or missing tables safely', () => {
      expect(formatTablesCount(0)).toBe('0 mesas');
      expect(formatTablesCount(undefined)).toBe('0 mesas');
      expect(formatTablesCount(null)).toBe('0 mesas');
      expect(formatTablesCount(NaN)).toBe('0 mesas');
    });
  });

  describe('isRouteActive', () => {
    it('matches exact root dashboard path', () => {
      expect(isRouteActive('/dashboard', '/dashboard')).toBe(true);
      expect(isRouteActive('/dashboard/overview', '/dashboard')).toBe(false);
    });

    it('matches nested paths for submodules', () => {
      expect(isRouteActive('/menu', '/menu')).toBe(true);
      expect(isRouteActive('/menu/categories', '/menu')).toBe(true);
      expect(isRouteActive('/orders/123', '/orders')).toBe(true);
      expect(isRouteActive('/tables', '/kds')).toBe(false);
      expect(isRouteActive('/analytics', '/analytics')).toBe(true);
      expect(isRouteActive('/settings', '/settings')).toBe(true);
    });

    it('handles falsy parameters safely', () => {
      expect(isRouteActive('', '/dashboard')).toBe(false);
      expect(isRouteActive('/dashboard', '')).toBe(false);
    });
  });
});
