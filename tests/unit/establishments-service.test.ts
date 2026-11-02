import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEstablishmentByUserId,
  saveStoreDataStep,
  saveOperationStep,
  saveSubaccountAndActivate,
  updateSubscriptionStatus,
} from '@/lib/appwrite/establishments';

const mockDatabases = {
  listDocuments: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
};

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: mockDatabases,
  }),
}));

describe('Establishments Appwrite Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEstablishmentByUserId', () => {
    it('should return null when establishment not found', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
      const est = await getEstablishmentByUserId('user_123');
      expect(est).toBeNull();
    });

    it('should return establishment document when found', async () => {
      const mockDoc = { $id: 'est_999', userId: 'user_123', name: 'Kero Burguer' };
      mockDatabases.listDocuments.mockResolvedValueOnce({ total: 1, documents: [mockDoc] });
      const est = await getEstablishmentByUserId('user_123');
      expect(est?.$id).toBe('est_999');
    });
  });

  describe('saveStoreDataStep (Passo 1)', () => {
    it('should create new establishment document if none exists', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
      mockDatabases.createDocument.mockResolvedValueOnce({
        $id: 'est_created',
        userId: 'user_123',
        name: 'Kero Burguer',
        onboardingStep: 2,
      });

      const res = await saveStoreDataStep('user_123', {
        name: 'Kero Burguer',
        legalName: 'Kero Burguer LTDA',
        cnpj: '48192837000106',
        category: 'hamburgueria',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
      });

      expect(res.$id).toBe('est_created');
      expect(mockDatabases.createDocument).toHaveBeenCalled();
    });

    it('should update existing establishment document if already created', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({
        total: 1,
        documents: [{ $id: 'est_existing', userId: 'user_123' }],
      });
      mockDatabases.updateDocument.mockResolvedValueOnce({
        $id: 'est_existing',
        name: 'Kero Burguer Atualizado',
      });

      const res = await saveStoreDataStep('user_123', {
        name: 'Kero Burguer Atualizado',
        legalName: 'Kero Burguer LTDA',
        cnpj: '48192837000106',
        category: 'hamburgueria',
        phone: '11987654321',
        postalCode: '01414001',
        address: 'Rua Bela Cintra',
      });

      expect(res.$id).toBe('est_existing');
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'est_existing',
        expect.objectContaining({ name: 'Kero Burguer Atualizado', onboardingStep: 2 }),
      );
    });
  });

  describe('saveOperationStep (Passo 2)', () => {
    it('should update tablesCount, orderMode, and schedule', async () => {
      mockDatabases.updateDocument.mockResolvedValueOnce({
        $id: 'est_existing',
        tablesCount: 20,
        onboardingStep: 3,
      });

      const res = await saveOperationStep('est_existing', {
        tablesCount: 20,
        orderMode: 'direct',
        openingDays: ['seg', 'ter'],
        openingTime: '18:00',
        closingTime: '23:00',
      });

      expect(res.tablesCount).toBe(20);
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'est_existing',
        expect.objectContaining({
          tablesCount: 20,
          orderMode: 'direct',
          onboardingStep: 3,
        }),
      );
    });
  });

  describe('saveSubaccountAndActivate (Passo 3)', () => {
    it('should update bank info, R2 keys and Asaas IDs', async () => {
      mockDatabases.updateDocument.mockResolvedValueOnce({
        $id: 'est_existing',
        onboardingCompleted: true,
        onboardingStep: 4,
      });

      const res = await saveSubaccountAndActivate('est_existing', {
        subaccount: {
          repName: 'Carlos Moraes',
          repCpf: '52998224725',
          repBirthDate: '1988-06-14',
          bankCode: '341',
          bankPixKey: '48192837000106',
          bankAgency: '0842',
          bankAccount: '48291-7',
          docIdKey: 'establishments/est_existing/kyc/cnh.pdf',
          docCnpjKey: 'establishments/est_existing/kyc/cnpj.pdf',
        },
        asaas: {
          customerId: 'cus_123',
          subscriptionId: 'sub_456',
          subaccountId: 'act_789',
          walletId: 'wal_000',
        },
      });

      expect(res.onboardingCompleted).toBe(true);
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'est_existing',
        expect.objectContaining({
          asaasCustomerId: 'cus_123',
          asaasSubscriptionId: 'sub_456',
          asaasSubaccountId: 'act_789',
          onboardingStep: 4,
          onboardingCompleted: true,
        }),
      );
    });
  });

  describe('updateSubscriptionStatus', () => {
    it('should update status by subscription ID', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({
        total: 1,
        documents: [{ $id: 'est_found' }],
      });
      mockDatabases.updateDocument.mockResolvedValueOnce({
        $id: 'est_found',
        subscriptionStatus: 'active',
      });

      const res = await updateSubscriptionStatus('sub_456', 'active');
      expect(res?.subscriptionStatus).toBe('active');
    });
  });
});
