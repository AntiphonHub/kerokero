import { describe, it, expect } from 'vitest';
import {
  formatCentsToBrl,
  parseBrlToCents,
  maskCurrencyInput,
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
});
