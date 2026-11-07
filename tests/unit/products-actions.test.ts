import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveProductAction,
  deleteProductAction,
  toggleProductStatusAction,
  createCategoryAction,
} from '@/actions/products';

vi.mock('@/lib/appwrite/session', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentByUserId: vi.fn(),
}));

vi.mock('@/lib/appwrite/products', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  toggleProductStatus: vi.fn(),
  createCategory: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  createCategory,
} from '@/lib/appwrite/products';

describe('Products Server Actions', () => {
  const mockUser = { $id: 'user_123', email: 'test@bempedi.com' };
  const mockEstablishment = { $id: 'est_123', userId: 'user_123' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as any);
    vi.mocked(getEstablishmentByUserId).mockResolvedValue(mockEstablishment as any);
  });

  describe('saveProductAction', () => {
    it('deve retornar erro de autenticação se não houver usuário', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValueOnce(null);
      const res = await saveProductAction({
        name: 'Burger',
        price: 2000,
        categoryId: 'cat_1',
        categoryName: 'Lanches',
        isActive: true,
        addons: [],
        upsellProductIds: [],
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain('autenticado');
    });

    it('deve validar payload com Zod e rejeitar dados inválidos', async () => {
      const res = await saveProductAction({
        name: '', // Inválido
        price: -10, // Inválido
        categoryId: '',
        categoryName: '',
        isActive: true,
        addons: [],
        upsellProductIds: [],
      });

      expect(res.success).toBe(false);
      expect(res.errors).toBeDefined();
    });

    it('deve chamar createProduct quando não houver productId', async () => {
      vi.mocked(createProduct).mockResolvedValueOnce({
        $id: 'prod_new',
        name: 'Smash Burger',
      } as any);

      const res = await saveProductAction({
        name: 'Smash Burger',
        price: 2500,
        categoryId: 'cat_1',
        categoryName: 'Lanches',
        isActive: true,
        addons: [],
        upsellProductIds: [],
      });

      expect(res.success).toBe(true);
      expect(createProduct).toHaveBeenCalledWith('est_123', expect.any(Object));
    });

    it('deve chamar updateProduct quando productId for fornecido', async () => {
      vi.mocked(updateProduct).mockResolvedValueOnce({
        $id: 'prod_edit',
        name: 'Smash Burger Editado',
      } as any);

      const res = await saveProductAction(
        {
          name: 'Smash Burger Editado',
          price: 2800,
          categoryId: 'cat_1',
          categoryName: 'Lanches',
          isActive: true,
          addons: [],
          upsellProductIds: [],
        },
        'prod_edit',
      );

      expect(res.success).toBe(true);
      expect(updateProduct).toHaveBeenCalledWith('est_123', 'prod_edit', expect.any(Object));
    });
  });

  describe('deleteProductAction', () => {
    it('deve chamar deleteProduct com establishmentId do lojista', async () => {
      vi.mocked(deleteProduct).mockResolvedValueOnce(true);

      const res = await deleteProductAction('prod_del');
      expect(res.success).toBe(true);
      expect(deleteProduct).toHaveBeenCalledWith('est_123', 'prod_del');
    });
  });

  describe('toggleProductStatusAction', () => {
    it('deve alternar status do produto com sucesso', async () => {
      vi.mocked(toggleProductStatus).mockResolvedValueOnce({
        $id: 'prod_1',
        isActive: false,
      } as any);

      const res = await toggleProductStatusAction('prod_1');
      expect(res.success).toBe(true);
      expect(toggleProductStatus).toHaveBeenCalledWith('est_123', 'prod_1');
    });
  });

  describe('createCategoryAction', () => {
    it('deve criar categoria e retornar dados', async () => {
      vi.mocked(createCategory).mockResolvedValueOnce({
        $id: 'cat_new',
        name: 'Sobremesas',
        establishmentId: 'est_123',
      } as any);

      const res = await createCategoryAction('Sobremesas');
      expect(res.success).toBe(true);
      expect(res.category?.name).toBe('Sobremesas');
      expect(createCategory).toHaveBeenCalledWith('est_123', 'Sobremesas');
    });
  });
});
