import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createPixPaymentOnSubaccount,
  checkSubaccountPaymentStatus,
} from '@/lib/asaas/pix';

describe('Asaas Subaccount PIX Service', () => {
  const originalFetch = global.fetch;
  const mockSubaccountApiKey = '$aact_subaccount_mock_key_123';

  beforeEach(() => {
    vi.stubEnv('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3');
    vi.stubEnv('ASAAS_API_KEY', 'master_account_key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe('createPixPaymentOnSubaccount', () => {
    it('creates customer, payment and returns pix qr code and payload', async () => {
      const mockCustomer = { id: 'cus_sub_999' };
      const mockPayment = { id: 'pay_sub_888', value: 45.5 };
      const mockQrCode = {
        encodedImage: 'base64_qr_image_data',
        payload: '00020126580014br.gov.bcb.pix...',
        expirationDate: '2026-11-03 14:15:00',
      };

      const fetchMock = vi.fn();
      // 1. POST /customers
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCustomer,
      } as Response);
      // 2. POST /payments
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPayment,
      } as Response);
      // 3. GET /payments/pay_sub_888/pixQrCode
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQrCode,
      } as Response);

      global.fetch = fetchMock;

      const result = await createPixPaymentOnSubaccount(mockSubaccountApiKey, {
        customerName: 'Carlos Silva',
        customerCpf: '123.456.789-00',
        value: 45.5,
        description: 'Mesa 4 - Carlos Silva',
      });

      expect(result).toEqual({
        paymentId: 'pay_sub_888',
        pixQrCodeBase64: 'base64_qr_image_data',
        pixCopyPaste: '00020126580014br.gov.bcb.pix...',
        expirationDate: '2026-11-03 14:15:00',
      });

      // Verify POST /customers used subaccountApiKey and stripped CPF
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://sandbox.asaas.com/api/v3/customers',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            name: 'Carlos Silva',
            cpfCnpj: '12345678900',
          }),
        }),
      );

      // Verify POST /payments used customer id and billingType PIX
      const today = new Date().toISOString().split('T')[0];
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://sandbox.asaas.com/api/v3/payments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
          body: JSON.stringify({
            customer: 'cus_sub_999',
            billingType: 'PIX',
            value: 45.5,
            dueDate: today,
            description: 'Mesa 4 - Carlos Silva',
          }),
        }),
      );

      // Verify GET /payments/{id}/pixQrCode used subaccountApiKey
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        'https://sandbox.asaas.com/api/v3/payments/pay_sub_888/pixQrCode',
        expect.objectContaining({
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
        }),
      );
    });

    it('reuses existing customer if POST /customers fails due to existing CPF', async () => {
      const mockExistingCustomer = { data: [{ id: 'cus_existing_111' }] };
      const mockPayment = { id: 'pay_sub_777' };
      const mockQrCode = {
        encodedImage: 'base64_existing_qr',
        payload: 'pix_copia_e_cola_payload',
        expirationDate: '2026-11-03 15:00:00',
      };

      const fetchMock = vi.fn();
      // 1. POST /customers fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ errors: [{ description: 'CPF já cadastrado' }] }),
      } as Response);
      // 2. GET /customers?cpfCnpj=... finds existing
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockExistingCustomer,
      } as Response);
      // 3. POST /payments with existing customer id
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPayment,
      } as Response);
      // 4. GET /payments/pay_sub_777/pixQrCode
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQrCode,
      } as Response);

      global.fetch = fetchMock;

      const result = await createPixPaymentOnSubaccount(mockSubaccountApiKey, {
        customerName: 'Carlos Silva',
        customerCpf: '123.456.789-00',
        value: 30.0,
        description: 'Mesa 4 - Carlos',
      });

      expect(result.paymentId).toBe('pay_sub_777');
      expect(result.pixCopyPaste).toBe('pix_copia_e_cola_payload');

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://sandbox.asaas.com/api/v3/customers?cpfCnpj=12345678900',
        expect.objectContaining({
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
        }),
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        'https://sandbox.asaas.com/api/v3/payments',
        expect.objectContaining({
          body: expect.stringContaining('"customer":"cus_existing_111"'),
        }),
      );
    });

    it('throws error when payment creation fails', async () => {
      const mockCustomer = { id: 'cus_sub_999' };
      const fetchMock = vi.fn();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCustomer,
      } as Response);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ errors: [{ description: 'Valor mínimo não atingido' }] }),
      } as Response);

      global.fetch = fetchMock;

      await expect(
        createPixPaymentOnSubaccount(mockSubaccountApiKey, {
          customerName: 'Carlos',
          customerCpf: '12345678900',
          value: 0.5,
          description: 'Mesa 1',
        }),
      ).rejects.toThrow('Valor mínimo não atingido');
    });

    it('auto-provisions random EVP Pix key and retries if subaccount lacks a Pix key', async () => {
      const mockCustomer = { id: 'cus_sub_999' };
      const mockPayment = { id: 'pay_sub_888', value: 45.5 };
      const mockQrCode = {
        encodedImage: 'base64_qr_image_data',
        payload: '00020126580014br.gov.bcb.pix...',
        expirationDate: '2026-11-03 14:15:00',
      };

      const fetchMock = vi.fn();
      // 1. POST /customers
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCustomer,
      } as Response);
      // 2. POST /payments
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPayment,
      } as Response);
      // 3. GET /payments/pay_sub_888/pixQrCode fails: lacks Pix key
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ errors: [{ description: 'Você não possui uma chave Pix cadastrada' }] }),
      } as Response);
      // 4. POST /pix/addressKeys (auto-provision EVP)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: 'evp-key-123', type: 'EVP' }),
      } as Response);
      // 5. Retry GET /payments/pay_sub_888/pixQrCode succeeds!
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQrCode,
      } as Response);

      global.fetch = fetchMock;

      const result = await createPixPaymentOnSubaccount(mockSubaccountApiKey, {
        customerName: 'Carlos Silva',
        customerCpf: '123.456.789-00',
        value: 45.5,
        description: 'Mesa 4 - Carlos Silva',
      });

      expect(result.paymentId).toBe('pay_sub_888');
      expect(result.pixCopyPaste).toBe('00020126580014br.gov.bcb.pix...');
      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(fetchMock).toHaveBeenNthCalledWith(
        4,
        'https://sandbox.asaas.com/api/v3/pix/addressKeys',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'EVP' }),
        }),
      );
    });
  });

  describe('checkSubaccountPaymentStatus', () => {
    it('returns isPaid true when payment status is RECEIVED', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'pay_123', status: 'RECEIVED' }),
      } as Response);

      const res = await checkSubaccountPaymentStatus(mockSubaccountApiKey, 'pay_123');

      expect(res).toEqual({
        status: 'RECEIVED',
        isPaid: true,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox.asaas.com/api/v3/payments/pay_123',
        expect.objectContaining({
          headers: expect.objectContaining({
            access_token: mockSubaccountApiKey,
          }),
        }),
      );
    });

    it('returns isPaid true when payment status is CONFIRMED', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'pay_123', status: 'CONFIRMED' }),
      } as Response);

      const res = await checkSubaccountPaymentStatus(mockSubaccountApiKey, 'pay_123');

      expect(res).toEqual({
        status: 'CONFIRMED',
        isPaid: true,
      });
    });

    it('returns isPaid false when payment status is PENDING', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'pay_123', status: 'PENDING' }),
      } as Response);

      const res = await checkSubaccountPaymentStatus(mockSubaccountApiKey, 'pay_123');

      expect(res).toEqual({
        status: 'PENDING',
        isPaid: false,
      });
    });
  });
});
