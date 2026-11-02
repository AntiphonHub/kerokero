import { describe, it, expect } from 'vitest';
import {
  storeDataSchema,
  operationSchema,
  subaccountSchema,
} from '@/lib/schemas/onboarding';

describe('Onboarding Schemas - Step 1: storeDataSchema', () => {
  const validData = {
    name: 'Kero Burguer & Bar',
    legalName: 'Kero Burguer Alimentos LTDA',
    cnpj: '48.192.837/0001-06',
    category: 'hamburgueria',
    phone: '(11) 98765-4321',
    postalCode: '01414-001',
    address: 'Rua Bela Cintra, 1240 - Consolação',
  };

  it('should validate complete and correct store data', () => {
    const res = storeDataSchema.safeParse(validData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.cnpj).toBe('48192837000106'); // unmasked
      expect(res.data.phone).toBe('11987654321'); // unmasked
      expect(res.data.postalCode).toBe('01414001'); // unmasked
    }
  });

  it('should reject invalid CNPJ', () => {
    const res = storeDataSchema.safeParse({
      ...validData,
      cnpj: '48.192.837/0001-92', // invalid check digits
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.cnpj).toBeDefined();
    }
  });

  it('should reject empty or missing required fields', () => {
    const res = storeDataSchema.safeParse({
      name: '',
      legalName: '',
      cnpj: '',
      category: '',
      phone: '',
      postalCode: '',
      address: '',
    });
    expect(res.success).toBe(false);
  });
});

describe('Onboarding Schemas - Step 2: operationSchema', () => {
  const validData = {
    tablesCount: 15,
    orderMode: 'direct',
    openingDays: ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
    openingTime: '18:00',
    closingTime: '23:30',
  };

  it('should validate valid operation settings', () => {
    const res = operationSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it('should reject tablesCount out of bounds', () => {
    expect(operationSchema.safeParse({ ...validData, tablesCount: 0 }).success).toBe(false);
    expect(operationSchema.safeParse({ ...validData, tablesCount: 250 }).success).toBe(false);
  });

  it('should reject invalid orderMode', () => {
    expect(
      operationSchema.safeParse({ ...validData, orderMode: 'invalid_mode' }).success,
    ).toBe(false);
  });

  it('should reject empty opening days', () => {
    expect(operationSchema.safeParse({ ...validData, openingDays: [] }).success).toBe(false);
  });

  it('should reject invalid time formats', () => {
    expect(operationSchema.safeParse({ ...validData, openingTime: '25:00' }).success).toBe(false);
    expect(operationSchema.safeParse({ ...validData, closingTime: 'abc' }).success).toBe(false);
  });
});

describe('Onboarding Schemas - Step 3: subaccountSchema', () => {
  const validData = {
    repName: 'Carlos Eduardo de Moraes',
    repCpf: '529.982.247-25',
    repBirthDate: '1988-06-14',
    bankCode: '341',
    bankPixKey: '48192837000106',
    bankAgency: '0842',
    bankAccount: '48291-7',
    docIdKey: 'establishments/123/kyc/doc-id.pdf',
    docCnpjKey: 'establishments/123/kyc/doc-cnpj.pdf',
  };

  it('should validate correct subaccount and KYC data', () => {
    const res = subaccountSchema.safeParse(validData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.repCpf).toBe('52998224725'); // unmasked
    }
  });

  it('should reject invalid CPF for legal representative', () => {
    const res = subaccountSchema.safeParse({
      ...validData,
      repCpf: '111.111.111-11',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.repCpf).toBeDefined();
    }
  });

  it('should reject missing documents', () => {
    const res = subaccountSchema.safeParse({
      ...validData,
      docIdKey: '',
    });
    expect(res.success).toBe(false);
  });
});
