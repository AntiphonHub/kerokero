import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeAsaasApiKey, asaasRequest } from '@/lib/asaas/client';
import { createAsaasCustomer } from '@/lib/asaas/customers';
import { createAsaasSubscription, getAsaasSubscriptionPix } from '@/lib/asaas/subscriptions';
import { createAsaasSubaccount } from '@/lib/asaas/subaccounts';

describe('Asaas Services', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3');
    vi.stubEnv('ASAAS_API_KEY', 'test_asaas_secret_key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe('createAsaasCustomer', () => {
    it('should create a customer with formatted payload', async () => {
      const mockResponse = { id: 'cus_000005912345', name: 'Kero Burguer' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const customer = await createAsaasCustomer({
        name: 'Kero Burguer Alimentos LTDA',
        cpfCnpj: '48192837000106',
        email: 'financeiro@keroburguer.com',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
      });

      expect(customer.id).toBe('cus_000005912345');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox.asaas.com/api/v3/customers',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            access_token: 'test_asaas_secret_key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw error when Asaas returns failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: [{ description: 'CNPJ já cadastrado' }] }),
      } as Response);

      await expect(
        createAsaasCustomer({
          name: 'Kero Burguer',
          cpfCnpj: '48192837000106',
          email: 'teste@kero.com',
        }),
      ).rejects.toThrow('CNPJ já cadastrado');
    });
  });

  describe('createAsaasSubscription', () => {
    it('should create a monthly subscription for the establishment', async () => {
      const mockResponse = {
        id: 'sub_000001',
        customer: 'cus_000005912345',
        value: 149.0,
        status: 'ACTIVE',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const sub = await createAsaasSubscription({
        customerId: 'cus_000005912345',
        value: 149.0,
        description: 'Assinatura Bempedi',
      });

      expect(sub.id).toBe('sub_000001');
      expect(sub.status).toBe('ACTIVE');
    });
  });

  describe('getAsaasSubscriptionPix', () => {
    it('should retrieve PIX QRCode and payload for the first payment of subscription', async () => {
      // Mock payments listing
      const mockPayments = { data: [{ id: 'pay_123' }] };
      const mockPix = {
        encodedImage: 'base64_qrcode_data',
        payload: '00020126580014br.gov.bcb.pix...',
        expirationDate: '2026-11-01 23:59:59',
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayments,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPix,
        } as Response);

      const pix = await getAsaasSubscriptionPix('sub_000001');

      expect(pix.encodedImage).toBe('base64_qrcode_data');
      expect(pix.payload).toContain('br.gov.bcb.pix');
    });
  });

  describe('createAsaasSubaccount', () => {
    it('should create subaccount and return account id and walletId', async () => {
      const mockResponse = {
        id: 'act_0001122',
        name: 'Kero Burguer Alimentos LTDA',
        walletId: 'wal_778899',
        apiKey: '$aact_subaccount_secret',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const subaccount = await createAsaasSubaccount({
        name: 'Kero Burguer Alimentos LTDA',
        email: 'financeiro@keroburguer.com',
        cpfCnpj: '48192837000106',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
        addressNumber: '1240',
      });

      expect(subaccount.id).toBe('act_0001122');
      expect(subaccount.walletId).toBe('wal_778899');
    });
  });

  describe('sanitizeAsaasApiKey & client security', () => {
    it('should sanitize raw key with surrounding quotes', () => {
      expect(sanitizeAsaasApiKey('"$aact_valid_key"')).toBe('$aact_valid_key');
      expect(sanitizeAsaasApiKey("'$aact_valid_key'")).toBe('$aact_valid_key');
    });

    it('should remove escaped backslashes', () => {
      expect(sanitizeAsaasApiKey('\\$aact_valid_key')).toBe('$aact_valid_key');
    });

    it('should remove double dollar sign from docker compose escape', () => {
      expect(sanitizeAsaasApiKey('$$aact_valid_key')).toBe('$aact_valid_key');
    });

    it('should prepend $ if swallowed by environment variable interpolation', () => {
      expect(sanitizeAsaasApiKey('aact_valid_key')).toBe('$aact_valid_key');
    });

    it('should throw clear error when ASAAS_API_KEY is missing', async () => {
      vi.stubEnv('ASAAS_API_KEY', '');
      await expect(asaasRequest('/customers')).rejects.toThrow(
        'Chave de API do Asaas não configurada',
      );
    });
  });
});
