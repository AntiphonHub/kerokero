import { describe, it, expect } from 'vitest';
import {
  formatCentsToBrl,
  parseBrlToCents,
  maskCurrencyInput,
  formatBrasiliaDateTime,
} from '@/lib/formatters';

describe('formatters', () => {
  it('formatCentsToBrl formata centavos para Real', () => {
    expect(formatCentsToBrl(2500)).toContain('25,00');
    expect(formatCentsToBrl(0)).toContain('0,00');
    expect(formatCentsToBrl(null)).toContain('0,00');
  });

  it('parseBrlToCents converte strings formatadas para centavos inteiros', () => {
    expect(parseBrlToCents('25,00')).toBe(2500);
    expect(parseBrlToCents('R$ 1.250,50')).toBe(125050);
    expect(parseBrlToCents('')).toBe(0);
  });

  it('maskCurrencyInput formata input em tempo real', () => {
    expect(maskCurrencyInput('2500')).toBe('25,00');
    expect(maskCurrencyInput('100')).toBe('1,00');
    expect(maskCurrencyInput('')).toBe('');
  });

  describe('formatBrasiliaDateTime', () => {
    it('formata datas puras YYYY-MM-DD sem recuar para o dia anterior', () => {
      expect(formatBrasiliaDateTime('2026-11-04')).toBe('04/11/2026');
      expect(formatBrasiliaDateTime('2026-01-01')).toBe('01/01/2026');
    });

    it('formata timestamps ISO no fuso de Brasília America/Sao_Paulo (UTC-3)', () => {
      // 21:00 UTC deve formatar para 18:00 em Brasília
      const res = formatBrasiliaDateTime('2026-11-04T21:00:00Z');
      expect(res).toContain('04/11/2026');
      expect(res).toContain('18:00');
    });

    it('trata valores vazios ou nulos graciosamente', () => {
      expect(formatBrasiliaDateTime(null)).toBe('-');
      expect(formatBrasiliaDateTime(undefined)).toBe('-');
      expect(formatBrasiliaDateTime('')).toBe('-');
    });
  });
});
