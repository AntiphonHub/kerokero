import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateStoreSettingsAction,
  updateTablesCapacityAction,
  updatePasswordAction,
  cancelSubscriptionAction,
  deleteAccountAction,
} from '@/actions/settings';

const mockGetLoggedInUser = vi.fn();
const mockGetEstablishmentByUserId = vi.fn();
const mockUpdateEstablishmentData = vi.fn();
const mockAdjustEstablishmentTablesCapacity = vi.fn();
const mockCancelAsaasSubscription = vi.fn();
const mockUpdatePassword = vi.fn();
const mockCreateEmailPasswordSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockListEstablishmentTables = vi.fn();

vi.mock('@/lib/appwrite/session', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
  getSession: () => Promise.resolve({ secret: 'session_token' }),
}));

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentByUserId: (...args: any[]) => mockGetEstablishmentByUserId(...args),
  updateEstablishmentData: (...args: any[]) => mockUpdateEstablishmentData(...args),
}));

vi.mock('@/lib/appwrite/tables', () => ({
  adjustEstablishmentTablesCapacity: (...args: any[]) => mockAdjustEstablishmentTablesCapacity(...args),
  listEstablishmentTables: (...args: any[]) => mockListEstablishmentTables(...args),
}));

vi.mock('@/lib/asaas/subscriptions', () => ({
  cancelAsaasSubscription: (...args: any[]) => mockCancelAsaasSubscription(...args),
}));

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    users: {
      updatePassword: mockUpdatePassword,
    },
    account: {
      createEmailPasswordSession: mockCreateEmailPasswordSession,
      deleteSession: mockDeleteSession,
    },
  }),
}));

describe('Settings Server Actions', () => {
  const mockUser = { $id: 'user_123', email: 'dono@bar.com', name: 'Carlos Dono' };
  const mockEstablishment = {
    $id: 'est_123',
    userId: 'user_123',
    name: 'Bar do Carlos',
    phone: '11999998888',
    tablesCount: 10,
    asaasSubscriptionId: 'sub_asaas_1',
    subscriptionStatus: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateStoreSettingsAction', () => {
    it('retorna erro se usuário não autenticado', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(null);
      const res = await updateStoreSettingsAction({ name: 'Novo Bar' });
      expect(res.success).toBe(false);
      expect(res.message).toContain('Sessão expirada');
    });

    it('atualiza nome e telefone com sucesso', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockUpdateEstablishmentData.mockResolvedValueOnce({
        ...mockEstablishment,
        name: 'Bar do Carlos Atualizado',
      });

      const res = await updateStoreSettingsAction({
        name: 'Bar do Carlos Atualizado',
        phone: '11988887777',
      });

      expect(res.success).toBe(true);
      expect(mockUpdateEstablishmentData).toHaveBeenCalledWith(
        'est_123',
        expect.objectContaining({ name: 'Bar do Carlos Atualizado' }),
      );
    });
  });

  describe('updateTablesCapacityAction', () => {
    it('rejeita quantidade inválida (menor que 1 ou maior que 100)', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);

      const res = await updateTablesCapacityAction(0);
      expect(res.success).toBe(false);
      expect(res.message).toContain('entre 1 e 100');
    });

    it('rejeita redução quando mesas excedentes estão ocupadas', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockAdjustEstablishmentTablesCapacity.mockResolvedValueOnce({
        success: false,
        message: 'A Mesa 10 possui comanda em andamento.',
      });

      const res = await updateTablesCapacityAction(8);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Mesa 10 possui comanda');
    });

    it('aumenta ou reduz capacidade com sucesso quando salão livre', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockAdjustEstablishmentTablesCapacity.mockResolvedValueOnce({
        success: true,
        count: 15,
      });

      const res = await updateTablesCapacityAction(15);
      expect(res.success).toBe(true);
      expect(res.data?.tablesCount).toBe(15);
    });
  });

  describe('updatePasswordAction', () => {
    it('rejeita se senhas forem curtas ou divergentes', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);

      const res = await updatePasswordAction('atual123', 'nova1234', 'diferente1234');
      expect(res.success).toBe(false);
      expect(res.message).toContain('não coincidem');
    });

    it('atualiza senha via admin client quando dados válidos', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockUpdatePassword.mockResolvedValueOnce({});

      const res = await updatePasswordAction('senhaAtual123', 'novaSenhaForte123', 'novaSenhaForte123');
      expect(res.success).toBe(true);
      expect(mockUpdatePassword).toHaveBeenCalledWith('user_123', 'novaSenhaForte123');
    });
  });

  describe('cancelSubscriptionAction', () => {
    it('cancela no Asaas e marca como cancelada no Appwrite', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockCancelAsaasSubscription.mockResolvedValueOnce(true);

      const res = await cancelSubscriptionAction();
      expect(res.success).toBe(true);
      expect(mockCancelAsaasSubscription).toHaveBeenCalledWith('sub_asaas_1');
      expect(mockUpdateEstablishmentData).toHaveBeenCalledWith('est_123', {
        subscriptionStatus: 'canceled',
      });
    });
  });

  describe('deleteAccountAction', () => {
    it('rejeita se o nome digitado não for idêntico ao da loja', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);

      const res = await deleteAccountAction('Nome Errado');
      expect(res.success).toBe(false);
      expect(res.message).toContain('confirmação incorreto');
    });

    it('rejeita exclusão se houver mesas ocupadas no momento', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockListEstablishmentTables.mockResolvedValueOnce([
        { $id: 't1', number: 1, status: 'occupied' },
      ]);

      const res = await deleteAccountAction('Bar do Carlos');
      expect(res.success).toBe(false);
      expect(res.message).toContain('comandas abertas');
    });

    it('cancela Asaas e desativa estabelecimento quando confirmado', async () => {
      mockGetLoggedInUser.mockResolvedValueOnce(mockUser);
      mockGetEstablishmentByUserId.mockResolvedValueOnce(mockEstablishment);
      mockListEstablishmentTables.mockResolvedValueOnce([
        { $id: 't1', number: 1, status: 'idle' },
      ]);
      mockCancelAsaasSubscription.mockResolvedValueOnce(true);

      const res = await deleteAccountAction('Bar do Carlos');
      expect(res.success).toBe(true);
      expect(mockUpdateEstablishmentData).toHaveBeenCalledWith('est_123', {
        isActive: false,
        subscriptionStatus: 'canceled',
      });
    });
  });
});
