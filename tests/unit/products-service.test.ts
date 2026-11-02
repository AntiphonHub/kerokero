import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProductsByEstablishment,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getCategoriesByEstablishment,
  createCategory,
} from '@/lib/appwrite/products';

const mockDatabases = {
  listDocuments: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getDocument: vi.fn(),
};

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    databases: mockDatabases,
  }),
}));

describe('Products & Categories Appwrite Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategoriesByEstablishment', () => {
    it('deve listar categorias filtrando pelo establishmentId', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({
        total: 2,
        documents: [
          { $id: 'cat_1', name: 'Bebidas', establishmentId: 'est_10' },
          { $id: 'cat_2', name: 'Lanches', establishmentId: 'est_10' },
        ],
      });

      const categories = await getCategoriesByEstablishment('est_10');
      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe('Bebidas');
      expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.arrayContaining([expect.anything()]),
      );
    });
  });

  describe('createCategory', () => {
    it('deve reutilizar categoria existente com mesmo nome (case-insensitive)', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({
        total: 1,
        documents: [{ $id: 'cat_existing', name: 'Bebidas', establishmentId: 'est_10' }],
      });

      const cat = await createCategory('est_10', 'bebidas');
      expect(cat.$id).toBe('cat_existing');
      expect(mockDatabases.createDocument).not.toHaveBeenCalled();
    });

    it('deve criar nova categoria quando não existir', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
      mockDatabases.createDocument.mockResolvedValueOnce({
        $id: 'cat_new',
        name: 'Sobremesas',
        establishmentId: 'est_10',
      });

      const cat = await createCategory('est_10', 'Sobremesas');
      expect(cat.$id).toBe('cat_new');
      expect(mockDatabases.createDocument).toHaveBeenCalled();
    });
  });

  describe('getProductsByEstablishment', () => {
    it('deve listar produtos do estabelecimento e desserializar addons', async () => {
      mockDatabases.listDocuments.mockResolvedValueOnce({
        total: 1,
        documents: [
          {
            $id: 'prod_1',
            establishmentId: 'est_10',
            name: 'Smash Burger',
            price: 2500,
            addons: JSON.stringify([{ id: 'a1', name: 'Queijo', price: 300 }]),
            upsellProductIds: ['prod_2'],
            isActive: true,
            stockQuantity: 15,
          },
        ],
      });

      const products = await getProductsByEstablishment('est_10');
      expect(products).toHaveLength(1);
      expect(products[0].addons).toEqual([{ id: 'a1', name: 'Queijo', price: 300 }]);
      expect(products[0].stockQuantity).toBe(15);
    });
  });

  describe('createProduct', () => {
    it('deve criar produto com payload serializado e multi-tenant', async () => {
      mockDatabases.createDocument.mockResolvedValueOnce({
        $id: 'prod_new',
        establishmentId: 'est_10',
        name: 'Coca Cola',
        price: 800,
        addons: '[]',
        upsellProductIds: [],
        isActive: true,
      });

      const res = await createProduct('est_10', {
        name: 'Coca Cola',
        description: 'Lata 350ml',
        price: 800,
        happyHourPrice: null,
        stockQuantity: 50,
        categoryId: 'cat_1',
        categoryName: 'Bebidas',
        isActive: true,
        addons: [],
        upsellProductIds: [],
      });

      expect(res.$id).toBe('prod_new');
      expect(mockDatabases.createDocument).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('deve bloquear edição se produto pertencer a outro estabelecimento', async () => {
      mockDatabases.getDocument.mockResolvedValueOnce({
        $id: 'prod_1',
        establishmentId: 'est_OTHER',
      });

      await expect(
        updateProduct('est_10', 'prod_1', {
          name: 'Nome Modificado',
          price: 1000,
          categoryId: 'cat_1',
          categoryName: 'Bebidas',
          isActive: true,
          addons: [],
          upsellProductIds: [],
        }),
      ).rejects.toThrow('Produto não pertence a este estabelecimento');
    });
  });

  describe('deleteProduct', () => {
    it('deve remover produto validando tenant', async () => {
      mockDatabases.getDocument.mockResolvedValueOnce({
        $id: 'prod_1',
        establishmentId: 'est_10',
      });
      mockDatabases.deleteDocument.mockResolvedValueOnce({});

      const success = await deleteProduct('est_10', 'prod_1');
      expect(success).toBe(true);
      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'prod_1',
      );
    });
  });

  describe('toggleProductStatus', () => {
    it('deve alternar status ativo/inativo', async () => {
      mockDatabases.getDocument.mockResolvedValueOnce({
        $id: 'prod_1',
        establishmentId: 'est_10',
        isActive: true,
      });
      mockDatabases.updateDocument.mockResolvedValueOnce({
        $id: 'prod_1',
        establishmentId: 'est_10',
        isActive: false,
      });

      const updated = await toggleProductStatus('est_10', 'prod_1');
      expect(updated.isActive).toBe(false);
    });
  });
});
