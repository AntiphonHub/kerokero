import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSubaccountBalance,
  createSubaccountTransfer,
  listSubaccountTransfers,
} from '@/lib/asaas/transfers';

describe('Asaas Transfers & Balance Service', () => {
  const originalFetch = global.fetch;
  const mockSubaccountApiKey = '$aact_subaccount_test_key';

  beforeEach(() => {
    vi.stubEnv('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3');
    vi.stubEnv('ASAAS_API_KEY', 'master_account_key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe('getSubaccountBalance', () => {
    it('returns balance and availableBalance of the subaccount', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          balance: 1540.25,
          availableBalance: 1500.0,
        }),
      } as Response);

      const res = await getSubaccountBalance(mockSubaccountApiKey);

      expect(res).toEqual({
        balance: 1540.25,
        availableBalance: 1500.0,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox.asaas.com/api/v3/finance/balance',
        expect.objectContaining({
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
        }),
      );
    });

    it('uses balance as availableBalance when Asaas only returns balance', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          balance: 36.02,
        }),
      } as Response);

      const res = await getSubaccountBalance(mockSubaccountApiKey);

      expect(res).toEqual({
        balance: 36.02,
        availableBalance: 36.02,
      });
    });
  });

  describe('createSubaccountTransfer', () => {
    it('executes a PIX transfer using pixAddressKey', async () => {
      const mockTransferResponse = {
        id: 'tra_999888',
        value: 250.0,
        netValue: 250.0,
        status: 'PENDING',
        type: 'PIX',
        dateCreated: '2026-11-04',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTransferResponse,
      } as Response);

      const res = await createSubaccountTransfer(mockSubaccountApiKey, {
        value: 250.0,
        pixAddressKey: '48192837000106',
        description: 'Saque Bempedi',
      });

      expect(res.id).toBe('tra_999888');
      expect(res.value).toBe(250.0);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox.asaas.com/api/v3/transfers',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
          body: JSON.stringify({
            value: 250.0,
            operationType: 'PIX',
            pixAddressKey: '48192837000106',
            description: 'Saque Bempedi',
          }),
        }),
      );
    });

    it('throws error if transfer is rejected by Asaas', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [{ description: 'Saldo insuficiente para transferência' }],
        }),
      } as Response);

      await expect(
        createSubaccountTransfer(mockSubaccountApiKey, {
          value: 99999.0,
          pixAddressKey: '48192837000106',
        }),
      ).rejects.toThrow('Saldo insuficiente para transferência');
    });
  });

  describe('listSubaccountTransfers', () => {
    it('returns transfer history ordered by latest transfers', async () => {
      const mockTransfers = [
        {
          id: 'tra_1',
          value: 100.0,
          status: 'DONE',
          dateCreated: '2026-11-03',
          type: 'PIX',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: mockTransfers,
          totalCount: 1,
        }),
      } as Response);

      const res = await listSubaccountTransfers(mockSubaccountApiKey);
      expect(res).toEqual(mockTransfers);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox.asaas.com/api/v3/transfers?limit=20&order=desc',
        expect.objectContaining({
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
        }),
      );
    });
  });
});
