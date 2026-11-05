import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockGetLoggedInUser = vi.fn();
const mockGetEstablishmentByUserId = vi.fn();
const mockUpdateEstablishmentBankPixKey = vi.fn();
const mockGetSubaccountBalance = vi.fn();
const mockCreateSubaccountTransfer = vi.fn();
const mockListSubaccountTransfers = vi.fn();

vi.mock('@/lib/appwrite/session', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentByUserId: () => mockGetEstablishmentByUserId(),
  updateEstablishmentBankPixKey: (...args: any[]) => mockUpdateEstablishmentBankPixKey(...args),
}));

vi.mock('@/lib/asaas/transfers', () => ({
  getSubaccountBalance: (...args: any[]) => mockGetSubaccountBalance(...args),
  createSubaccountTransfer: (...args: any[]) => mockCreateSubaccountTransfer(...args),
  listSubaccountTransfers: (...args: any[]) => mockListSubaccountTransfers(...args),
}));

import { getWalletDataAction, requestWithdrawalAction } from '@/actions/wallet';
import { encryptSecret } from '@/lib/security/encryption';

describe('Wallet Server Actions', () => {
  const plainApiKey = '$aact_subaccount_real_key_123';
  const encryptedApiKey = encryptSecret(plainApiKey);

  const mockUser = { $id: 'user_123', email: 'owner@kerokero.com' };
  const mockEstablishment = {
    $id: 'est_123',
    userId: 'user_123',
    name: 'Burger & Co',
    bankPixKey: '48192837000106',
    bankCode: '341',
    bankAgency: '0842',
    bankAccount: '48291-7',
    repName: 'Carlos Eduardo',
    subaccountStatus: 'approved',
    asaasSubaccountApiKey: encryptedApiKey,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockGetEstablishmentByUserId.mockResolvedValue(mockEstablishment);
  });

  describe('getWalletDataAction', () => {
    it('returns error if user is unauthenticated', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      const res = await getWalletDataAction();
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/sessão/i);
    });

    it('returns balance, bank details, and transfers history', async () => {
      mockGetSubaccountBalance.mockResolvedValue({
        balance: 1250.0,
        availableBalance: 1200.0,
      });
      mockListSubaccountTransfers.mockResolvedValue([
        { id: 'tra_1', value: 100.0, status: 'DONE' },
      ]);

      const res = await getWalletDataAction();

      expect(res.success).toBe(true);
      expect(res.data?.balance).toBe(1250.0);
      expect(res.data?.availableBalance).toBe(1200.0);
      expect(res.data?.bankPixKey).toBe('48192837000106');
      expect(res.data?.transfers).toHaveLength(1);
      expect(mockGetSubaccountBalance).toHaveBeenCalledWith(plainApiKey);
    });
  });

  describe('requestWithdrawalAction', () => {
    it('rejects invalid or non-positive amounts', async () => {
      const res = await requestWithdrawalAction(0);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/maior que zero/i);

      const resNeg = await requestWithdrawalAction(-50);
      expect(resNeg.success).toBe(false);
    });

    it('rejects withdrawal if amount exceeds available balance', async () => {
      mockGetSubaccountBalance.mockResolvedValue({
        balance: 100.0,
        availableBalance: 80.0,
      });

      const res = await requestWithdrawalAction(150.0);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/saldo disponível/i);
    });

    it('successfully processes withdrawal if amount is valid', async () => {
      mockGetSubaccountBalance.mockResolvedValue({
        balance: 500.0,
        availableBalance: 500.0,
      });
      mockCreateSubaccountTransfer.mockResolvedValue({
        id: 'tra_new_123',
        value: 200.0,
        status: 'PENDING',
      });

      const res = await requestWithdrawalAction(200.0);

      expect(res.success).toBe(true);
      expect(res.data?.transferId).toBe('tra_new_123');
      expect(mockCreateSubaccountTransfer).toHaveBeenCalledWith(plainApiKey, {
        value: 200.0,
        pixAddressKey: '48192837000106',
        description: 'Saque KeroKero - Burger & Co',
      });
    });

    it('allows custom pix key and pix key type and updates establishment', async () => {
      mockGetSubaccountBalance.mockResolvedValue({
        balance: 500.0,
        availableBalance: 500.0,
      });
      mockCreateSubaccountTransfer.mockResolvedValue({
        id: 'tra_new_456',
        value: 150.0,
        status: 'PENDING',
      });

      const res = await requestWithdrawalAction(150.0, {
        pixAddressKey: 'financeiro@burger.com',
        pixAddressKeyType: 'EMAIL',
      });

      expect(res.success).toBe(true);
      expect(mockCreateSubaccountTransfer).toHaveBeenCalledWith(plainApiKey, {
        value: 150.0,
        pixAddressKey: 'financeiro@burger.com',
        pixAddressKeyType: 'EMAIL',
        description: 'Saque KeroKero - Burger & Co',
      });
      expect(mockUpdateEstablishmentBankPixKey).toHaveBeenCalledWith(
        'est_123',
        'financeiro@burger.com',
      );
    });
  });
});
