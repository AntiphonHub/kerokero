import { describe, it, expect } from 'vitest';
import { isValidCnpj } from '@/lib/validators/cnpj';
import { isValidCpf } from '@/lib/validators/cpf';

describe('Validators - CNPJ', () => {
  it('should accept valid CNPJ with or without formatting', () => {
    // Standard test CNPJs with mathematically valid check digits
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('48.192.837/0001-06')).toBe(true);
    expect(isValidCnpj('48192837000106')).toBe(true);
  });

  it('should reject CNPJ with invalid check digits', () => {
    expect(isValidCnpj('48.192.837/0001-92')).toBe(false);
    expect(isValidCnpj('48.192.837/0001-90')).toBe(false);
    expect(isValidCnpj('48192837000100')).toBe(false);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('should reject CNPJ with repeated sequences', () => {
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false);
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
    expect(isValidCnpj('99.999.999/9999-99')).toBe(false);
  });

  it('should reject invalid length or empty values', () => {
    expect(isValidCnpj('')).toBe(false);
    expect(isValidCnpj('123')).toBe(false);
    expect(isValidCnpj('4819283700019')).toBe(false);
    expect(isValidCnpj('4819283700019299')).toBe(false);
  });
});

describe('Validators - CPF', () => {
  it('should accept valid CPF with or without formatting', () => {
    // Valid CPF test vectors
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('should reject CPF with invalid check digits', () => {
    expect(isValidCpf('529.982.247-24')).toBe(false);
    expect(isValidCpf('123.456.789-00')).toBe(false);
  });

  it('should reject CPF with all digits identical', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('000.000.000-00')).toBe(false);
    expect(isValidCpf('99999999999')).toBe(false);
  });

  it('should reject invalid length or empty values', () => {
    expect(isValidCpf('')).toBe(false);
    expect(isValidCpf('12345')).toBe(false);
    expect(isValidCpf('529982247259')).toBe(false);
  });
});
