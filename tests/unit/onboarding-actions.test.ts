import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitStoreDataAction,
  submitOperationAction,
  submitSubaccountAction,
  checkSubscriptionStatusAction,
} from '@/actions/onboarding';

vi.mock('@/lib/appwrite/session', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentByUserId: vi.fn(),
  saveStoreDataStep: vi.fn(),
  saveOperationStep: vi.fn(),
  saveSubaccountAndActivate: vi.fn(),
}));

vi.mock('@/lib/appwrite/tables', () => ({
  ensureEstablishmentTables: vi.fn(),
}));

vi.mock('@/lib/asaas/customers', () => ({
  createAsaasCustomer: vi.fn(),
  createOrGetAsaasCustomer: vi.fn(),
}));

vi.mock('@/lib/asaas/subscriptions', () => ({
  createAsaasSubscription: vi.fn(),
  createOrGetAsaasSubscription: vi.fn(),
  cancelAsaasSubscription: vi.fn(),
  getAsaasSubscriptionPix: vi.fn(),
}));

vi.mock('@/lib/asaas/subaccounts', () => ({
  createAsaasSubaccount: vi.fn(),
}));

vi.mock('@/lib/r2/storage', () => ({
  generateKycKey: vi.fn((id, type, name) => `establishments/${id}/kyc/${type}_${name}`),
  uploadKycDocument: vi.fn(),
}));

import { getLoggedInUser } from '@/lib/appwrite/session';
import {
  getEstablishmentByUserId,
  saveStoreDataStep,
  saveOperationStep,
  saveSubaccountAndActivate,
} from '@/lib/appwrite/establishments';
import { createAsaasCustomer, createOrGetAsaasCustomer } from '@/lib/asaas/customers';
import { createAsaasSubscription, createOrGetAsaasSubscription } from '@/lib/asaas/subscriptions';
import { createAsaasSubaccount } from '@/lib/asaas/subaccounts';
import { decryptSecret } from '@/lib/security/encryption';

describe('Onboarding Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitStoreDataAction', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce(null);

      const formData = new FormData();
      const res = await submitStoreDataAction({}, formData);

      expect(res.message).toBe('Sessão expirada. Faça login novamente.');
    });

    it('should validate and save store data', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({
        $id: 'user_123',
        name: 'Carlos',
        email: 'carlos@kero.com',
      } as any);
      vi.mocked(saveStoreDataStep).mockResolvedValueOnce({
        $id: 'est_123',
        onboardingStep: 2,
      } as any);

      const formData = new FormData();
      formData.set('name', 'Kero Burguer & Bar');
      formData.set('legalName', 'Kero Burguer Alimentos LTDA');
      formData.set('cnpj', '48.192.837/0001-06');
      formData.set('category', 'hamburgueria');
      formData.set('phone', '(11) 98765-4321');
      formData.set('postalCode', '01414-001');
      formData.set('address', 'Rua Bela Cintra, 1240 - Consolação');

      const res = await submitStoreDataAction({}, formData);

      expect(res.success).toBe(true);
      expect(res.nextStep).toBe('/onboarding/operacao');
      expect(saveStoreDataStep).toHaveBeenCalledWith(
        'user_123',
        expect.objectContaining({ cnpj: '48192837000106' }),
      );
    });

    it('should return validation errors for invalid data', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({
        $id: 'user_123',
      } as any);

      const formData = new FormData();
      formData.set('name', '');
      formData.set('cnpj', '123');

      const res = await submitStoreDataAction({}, formData);

      expect(res.errors).toBeDefined();
      expect(res.success).toBeFalsy();
    });
  });

  describe('submitOperationAction', () => {
    it('should save operation settings and tables count', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({ $id: 'user_123' } as any);
      vi.mocked(getEstablishmentByUserId).mockResolvedValueOnce({
        $id: 'est_123',
      } as any);
      vi.mocked(saveOperationStep).mockResolvedValueOnce({
        $id: 'est_123',
        onboardingStep: 3,
      } as any);

      const formData = new FormData();
      formData.set('tablesCount', '15');
      formData.set('orderMode', 'direct');
      formData.set('openingDays', JSON.stringify(['ter', 'qua', 'qui', 'sex', 'sab', 'dom']));
      formData.set('openingTime', '18:00');
      formData.set('closingTime', '23:30');

      const res = await submitOperationAction({}, formData);

      expect(res.success).toBe(true);
      expect(res.nextStep).toBe('/onboarding/subconta');
      expect(saveOperationStep).toHaveBeenCalledWith(
        'est_123',
        expect.objectContaining({ tablesCount: 15, orderMode: 'direct' }),
      );
    });
  });

  describe('submitSubaccountAction', () => {
    it('should orchestrate R2 uploads, Asaas calls and activation', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({
        $id: 'user_123',
        email: 'dono@keroburguer.com',
      } as any);
      vi.mocked(getEstablishmentByUserId).mockResolvedValueOnce({
        $id: 'est_123',
        name: 'Kero Burguer',
        legalName: 'Kero Burguer LTDA',
        cnpj: '48192837000106',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
      } as any);

      vi.mocked(createOrGetAsaasCustomer).mockResolvedValueOnce({
        id: 'cus_test_123',
      } as any);
      vi.mocked(createOrGetAsaasSubscription).mockResolvedValueOnce({
        id: 'sub_test_456',
        status: 'ACTIVE',
      } as any);
      vi.mocked(createAsaasSubaccount).mockResolvedValueOnce({
        id: 'act_test_789',
        walletId: 'wal_test_000',
        apiKey: '$aact_test_key_123',
      } as any);

      vi.mocked(saveSubaccountAndActivate).mockResolvedValueOnce({
        $id: 'est_123',
        onboardingCompleted: true,
      } as any);

      const formData = new FormData();
      formData.set('repName', 'Carlos Eduardo de Moraes');
      formData.set('repCpf', '529.982.247-25');
      formData.set('repBirthDate', '1988-06-14');
      formData.set('bankCode', '341');
      formData.set('bankPixKey', '48192837000106');
      formData.set('bankAgency', '0842');
      formData.set('bankAccount', '48291-7');

      // Fake file uploads
      const docCnh = new File(['fake cnh content'], 'cnh.pdf', { type: 'application/pdf' });
      const docCnpj = new File(['fake cnpj content'], 'cnpj.pdf', { type: 'application/pdf' });
      formData.set('docId', docCnh);
      formData.set('docCnpj', docCnpj);

      const res = await submitSubaccountAction({}, formData);

      expect(res.success).toBe(true);
      expect(res.nextStep).toBe('/onboarding/conclusao');
      expect(createOrGetAsaasCustomer).toHaveBeenCalled();
      expect(createOrGetAsaasSubscription).toHaveBeenCalled();
      expect(createAsaasSubaccount).toHaveBeenCalled();
      expect(saveSubaccountAndActivate).toHaveBeenCalledWith(
        'est_123',
        expect.objectContaining({
          asaas: expect.objectContaining({
            customerId: 'cus_test_123',
            subscriptionId: 'sub_test_456',
            subaccountId: 'act_test_789',
            walletId: 'wal_test_000',
            subaccountApiKey: expect.stringMatching(/^enc:v[12]:/),
          }),
        }),
      );

      const callArgs = vi.mocked(saveSubaccountAndActivate).mock.calls[0][1];
      expect(decryptSecret(callArgs.asaas.subaccountApiKey)).toBe('$aact_test_key_123');
    });

    it('should succeed and activate without mandatory file uploads (Asaas dynamic KYC)', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({
        $id: 'user_123',
        email: 'dono@keroburguer.com',
      } as any);
      vi.mocked(getEstablishmentByUserId).mockResolvedValueOnce({
        $id: 'est_123',
        name: 'Kero Burguer',
        legalName: 'Kero Burguer LTDA',
        cnpj: '48192837000106',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
      } as any);

      vi.mocked(createOrGetAsaasCustomer).mockResolvedValueOnce({ id: 'cus_test_123' } as any);
      vi.mocked(createOrGetAsaasSubscription).mockResolvedValueOnce({ id: 'sub_test_456' } as any);
      vi.mocked(createAsaasSubaccount).mockResolvedValueOnce({
        id: 'act_test_789',
        walletId: 'wal_test_000',
        apiKey: '$aact_test_key_123',
      } as any);
      vi.mocked(saveSubaccountAndActivate).mockResolvedValueOnce({ $id: 'est_123' } as any);

      const formData = new FormData();
      formData.set('repName', 'Carlos Eduardo de Moraes');
      formData.set('repCpf', '529.982.247-25');
      formData.set('repBirthDate', '1988-06-14');
      formData.set('bankCode', '341');
      formData.set('bankPixKey', '48192837000106');
      formData.set('bankAgency', '0842');
      formData.set('bankAccount', '48291-7');

      const res = await submitSubaccountAction({}, formData);

      expect(res.success).toBe(true);
      expect(res.nextStep).toBe('/onboarding/conclusao');
      expect(createAsaasSubaccount).toHaveBeenCalled();
      expect(saveSubaccountAndActivate).toHaveBeenCalled();
    });

    it('should NOT create subscription if createAsaasSubaccount fails', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({
        $id: 'user_123',
        email: 'dono@keroburguer.com',
      } as any);
      vi.mocked(getEstablishmentByUserId).mockResolvedValueOnce({
        $id: 'est_123',
        name: 'Kero Burguer',
        legalName: 'Kero Burguer LTDA',
        cnpj: '48192837000106',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
      } as any);

      vi.mocked(createOrGetAsaasCustomer).mockResolvedValueOnce({ id: 'cus_test_123' } as any);
      vi.mocked(createAsaasSubaccount).mockRejectedValueOnce(new Error('CNPJ inválido no Asaas'));

      const formData = new FormData();
      formData.set('repName', 'Carlos Eduardo');
      formData.set('repCpf', '529.982.247-25');
      formData.set('repBirthDate', '1988-06-14');
      formData.set('bankCode', '341');
      formData.set('bankPixKey', '48192837000106');
      formData.set('bankAgency', '0842');
      formData.set('bankAccount', '48291-7');

      const res = await submitSubaccountAction({}, formData);

      expect(res.success).toBeFalsy();
      expect(res.message).toContain('CNPJ inválido no Asaas');
      expect(createOrGetAsaasSubscription).not.toHaveBeenCalled();
      expect(saveSubaccountAndActivate).not.toHaveBeenCalled();
    });
  });

  describe('checkSubscriptionStatusAction', () => {
    it('should return subscriptionStatus for authenticated user establishment', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce({ $id: 'user_123' } as any);
      vi.mocked(getEstablishmentByUserId).mockResolvedValueOnce({
        $id: 'est_123',
        subscriptionStatus: 'active',
      } as any);

      const status = await checkSubscriptionStatusAction();
      expect(status).toBe('active');
    });
  });
});
