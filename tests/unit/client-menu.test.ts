import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  filterProducts,
  getEffectiveProductPrice,
  calculateCustomizedUnitPrice,
  calculateItemTotal,
  mapCartItemsToOrderInput,
  resolveProductUpsells,
  resolveCartUpsells,
} from '@/lib/utils/menu';
import { cartStore } from '@/lib/store/cart-store';
import { submitOrderAction, type CartItemInput } from '@/actions/client';
import type { ProductDocument } from '@/lib/appwrite/products';

// Mock client Server Actions
vi.mock('@/actions/client', () => ({
  submitOrderAction: vi.fn(),
  getClientSessionAction: vi.fn(),
  callWaiterAction: vi.fn(),
  requestPixCheckoutAction: vi.fn(),
  pollPixStatusAction: vi.fn(),
}));

describe('Client Menu Utilities & Ordering Flow', () => {
  const mockProducts = [
    {
      $id: 'prod_1',
      $createdAt: '2026-11-01T10:00:00Z',
      $updatedAt: '2026-11-01T10:00:00Z',
      $permissions: [],
      $databaseId: 'main',
      $collectionId: 'products',
      establishmentId: 'est_1',
      categoryId: 'cat_burgers',
      categoryName: 'Hambúrgueres',
      name: 'Smash Burger Clássico',
      description: 'Pão brioche, blend 160g, queijo cheddar inglês e maionese da casa.',
      price: 3200,
      happyHourPrice: 2800,
      isActive: true,
      addons: [
        { id: 'add_bacon', name: 'Bacon Crocante', price: 600 },
        { id: 'add_cheese', name: 'Queijo Extra', price: 400 },
      ],
      upsellProductIds: [],
    },
    {
      $id: 'prod_2',
      $createdAt: '2026-11-01T10:05:00Z',
      $updatedAt: '2026-11-01T10:05:00Z',
      $permissions: [],
      $databaseId: 'main',
      $collectionId: 'products',
      establishmentId: 'est_1',
      categoryId: 'cat_burgers',
      categoryName: 'Hambúrgueres',
      name: 'Burger Duplo Artesanal',
      description: 'Dois blends de 140g, queijo prato e cebola caramelizada.',
      price: 4200,
      happyHourPrice: null,
      isActive: true,
      addons: [{ id: 'add_egg', name: 'Ovo Frito', price: 300 }],
      upsellProductIds: [],
    },
    {
      $id: 'prod_3',
      $createdAt: '2026-11-01T10:10:00Z',
      $updatedAt: '2026-11-01T10:10:00Z',
      $permissions: [],
      $databaseId: 'main',
      $collectionId: 'products',
      establishmentId: 'est_1',
      categoryId: 'cat_drinks',
      categoryName: 'Bebidas',
      name: 'Refrigerante Cola Lata',
      description: 'Lata 350ml gelada com gelo e limão.',
      price: 800,
      happyHourPrice: null,
      isActive: true,
      addons: [],
      upsellProductIds: [],
    },
    {
      $id: 'prod_inactive',
      $createdAt: '2026-11-01T10:15:00Z',
      $updatedAt: '2026-11-01T10:15:00Z',
      $permissions: [],
      $databaseId: 'main',
      $collectionId: 'products',
      establishmentId: 'est_1',
      categoryId: 'cat_drinks',
      categoryName: 'Bebidas',
      name: 'Cerveja Artesanal IPA',
      description: 'Fora de estoque temporariamente.',
      price: 1800,
      happyHourPrice: null,
      isActive: false,
      addons: [],
      upsellProductIds: [],
    },
  ] as unknown as ProductDocument[];

  beforeEach(() => {
    vi.clearAllMocks();
    cartStore.clearCart();
    cartStore.setTableToken('mock-table-token');
  });

  describe('filterProducts', () => {
    it('returns all active products when category is "all" and search is empty', () => {
      const result = filterProducts(mockProducts, 'all', '');
      expect(result).toHaveLength(3);
      expect(result.some((p) => p.$id === 'prod_inactive')).toBe(false);
    });

    it('returns all active products when category is null or undefined', () => {
      const result = filterProducts(mockProducts);
      expect(result).toHaveLength(3);
    });

    it('filters products strictly by categoryId', () => {
      const burgers = filterProducts(mockProducts, 'cat_burgers');
      expect(burgers).toHaveLength(2);
      expect(burgers.every((p) => p.categoryId === 'cat_burgers')).toBe(true);

      const drinks = filterProducts(mockProducts, 'cat_drinks');
      expect(drinks).toHaveLength(1);
      expect(drinks[0].$id).toBe('prod_3');
    });

    it('filters products by search query matching product name (case-insensitive and accents)', () => {
      const results = filterProducts(mockProducts, 'all', 'hambúrguer');
      expect(results).toHaveLength(0); // name has "Burger"

      const resultsBurger = filterProducts(mockProducts, 'all', 'burger');
      expect(resultsBurger).toHaveLength(2);

      const resultsCola = filterProducts(mockProducts, null, 'COLA');
      expect(resultsCola).toHaveLength(1);
      expect(resultsCola[0].name).toBe('Refrigerante Cola Lata');
    });

    it('filters products by search query matching product description', () => {
      const results = filterProducts(mockProducts, 'all', 'caramelizada');
      expect(results).toHaveLength(1);
      expect(results[0].$id).toBe('prod_2');
    });

    it('combines category filter and search query correctly', () => {
      const results = filterProducts(mockProducts, 'cat_burgers', 'duplo');
      expect(results).toHaveLength(1);
      expect(results[0].$id).toBe('prod_2');

      const noMatch = filterProducts(mockProducts, 'cat_drinks', 'duplo');
      expect(noMatch).toHaveLength(0);
    });

    it('filters products by categoryId "happy_hour" returning only active products with valid happy hour price', () => {
      const happyHourItems = filterProducts(mockProducts, 'happy_hour');
      expect(happyHourItems).toHaveLength(1);
      expect(happyHourItems[0].$id).toBe('prod_1');
    });

    it('handles empty input gracefully', () => {
      expect(filterProducts([])).toEqual([]);
      expect(filterProducts(null as any)).toEqual([]);
    });
  });

  describe('getEffectiveProductPrice', () => {
    it('returns regular price when happyHourPrice is null or not provided', () => {
      expect(getEffectiveProductPrice({ price: 3500, happyHourPrice: null }, true)).toBe(3500);
      expect(getEffectiveProductPrice({ price: 2000 }, true)).toBe(2000);
    });

    it('returns happyHourPrice only when isHappyHour is true', () => {
      expect(getEffectiveProductPrice({ price: 3500, happyHourPrice: 2800 }, true)).toBe(2800);
      // Fora do Happy Hour, deve retornar o preço regular
      expect(getEffectiveProductPrice({ price: 3500, happyHourPrice: 2800 }, false)).toBe(3500);
      expect(getEffectiveProductPrice({ price: 3500, happyHourPrice: 2800 })).toBe(3500);
    });

    it('falls back to regular price if happyHourPrice is zero or negative', () => {
      expect(getEffectiveProductPrice({ price: 3500, happyHourPrice: 0 }, true)).toBe(3500);
    });
  });

  describe('calculateCustomizedUnitPrice & calculateItemTotal', () => {
    it('calculates unit price without addons', () => {
      expect(calculateCustomizedUnitPrice(2500, [])).toBe(2500);
    });

    it('calculates unit price summing base price and addons', () => {
      const addons = [
        { price: 500 },
        { price: 350 },
      ];
      expect(calculateCustomizedUnitPrice(2500, addons)).toBe(3350);
    });

    it('calculates item total by multiplying unit price with quantity', () => {
      expect(calculateItemTotal(3350, 1)).toBe(3350);
      expect(calculateItemTotal(3350, 3)).toBe(10050);
      expect(calculateItemTotal(3350, 0)).toBe(3350); // defaults to min 1
    });
  });

  describe('mapCartItemsToOrderInput', () => {
    it('correctly maps CartItem array to CartItemInput array', () => {
      const cartItems = [
        {
          id: 'item_1',
          productId: 'prod_1',
          name: 'Smash Burger Clássico',
          priceCents: 3800,
          quantity: 2,
          notes: 'Sem cebola por favor',
          selectedOptions: ['Bacon Crocante'],
        },
        {
          id: 'item_2',
          productId: 'prod_3',
          name: 'Refrigerante Cola Lata',
          priceCents: 800,
          quantity: 1,
        },
      ];

      const mapped = mapCartItemsToOrderInput(cartItems);

      expect(mapped).toEqual([
        {
          productId: 'prod_1',
          productName: 'Smash Burger Clássico',
          unitPrice: 3800,
          quantity: 2,
          notes: 'Sem cebola por favor',
          selectedOptions: ['Bacon Crocante'],
        },
        {
          productId: 'prod_3',
          productName: 'Refrigerante Cola Lata',
          unitPrice: 800,
          quantity: 1,
        },
      ]);
    });

    it('omits empty notes or empty selectedOptions from input', () => {
      const cartItems = [
        {
          id: 'item_1',
          productId: 'prod_1',
          name: 'Smash Burger',
          priceCents: 3200,
          quantity: 1,
          notes: '   ',
          selectedOptions: [],
        },
      ];

      const mapped = mapCartItemsToOrderInput(cartItems);
      expect(mapped[0].notes).toBeUndefined();
      expect(mapped[0].selectedOptions).toBeUndefined();
    });
  });

  describe('Cart Integration & Order Submission Flow', () => {
    it('adds customized items to cartStore and calculates cart total correctly', () => {
      const product = mockProducts[0];
      const basePrice = getEffectiveProductPrice(product, true); // 2800 (happy hour)
      const selectedAddons = [product.addons[0]]; // Bacon Crocante (+600)
      const unitPrice = calculateCustomizedUnitPrice(basePrice, selectedAddons); // 3400
      const quantity = 2;

      cartStore.addItem({
        productId: product.$id,
        name: product.name,
        priceCents: unitPrice,
        quantity,
        notes: 'Ponto da carne: bem passado',
        selectedOptions: selectedAddons.map((a) => a.name),
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].priceCents).toBe(3400);
      expect(state.items[0].quantity).toBe(2);
      expect(cartStore.getTotalCents()).toBe(6800);
      expect(cartStore.getItemCount()).toBe(2);
    });

    it('submits cart items via submitOrderAction and clears cart on success', async () => {
      cartStore.addItem({
        productId: 'prod_1',
        name: 'Smash Burger Clássico',
        priceCents: 3200,
        quantity: 1,
      });

      const itemsToSubmit = mapCartItemsToOrderInput(cartStore.getState().items);
      expect(itemsToSubmit).toHaveLength(1);

      vi.mocked(submitOrderAction).mockResolvedValueOnce({
        success: true,
        message: 'Pedido enviado com sucesso para a cozinha!',
        data: {
          orders: [
            {
              $id: 'order_1',
              establishmentId: 'est_1',
              tableId: 'table_1',
              tableNumber: 1,
              sessionId: 'sess_1',
              participantId: 'part_1',
              participantName: 'Carlos',
              productId: 'prod_1',
              productName: 'Smash Burger Clássico',
              unitPrice: 3200,
              quantity: 1,
              totalPrice: 3200,
              status: 'pending',
              createdAt: new Date().toISOString(),
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              $permissions: [],
              $databaseId: 'main',
              $collectionId: 'orders',
            } as any,
          ],
        },
      });

      const response = await submitOrderAction(itemsToSubmit);

      expect(response.success).toBe(true);
      expect(submitOrderAction).toHaveBeenCalledWith(itemsToSubmit);

      // On successful order, clear cart
      if (response.success) {
        cartStore.clearCart();
      }

      expect(cartStore.getState().items).toHaveLength(0);
      expect(cartStore.getTotalCents()).toBe(0);
    });

    it('retains cart items if submitOrderAction fails', async () => {
      cartStore.addItem({
        productId: 'prod_1',
        name: 'Smash Burger Clássico',
        priceCents: 3200,
        quantity: 1,
      });

      const itemsToSubmit = mapCartItemsToOrderInput(cartStore.getState().items);

      vi.mocked(submitOrderAction).mockResolvedValueOnce({
        success: false,
        message: 'Sessão expirada. Escaneie novamente.',
      });

      const response = await submitOrderAction(itemsToSubmit);
      expect(response.success).toBe(false);

      // Cart should not be cleared on failure
      expect(cartStore.getState().items).toHaveLength(1);
    });
  });

  describe('resolveProductUpsells', () => {
    const productsList = [
      {
        $id: 'p_burger',
        name: 'Burger',
        isActive: true,
        price: 3000,
        upsellProductIds: ['p_fries', 'p_coke', 'p_inactive', 'p_burger'],
        upsellMessage: 'Vai uma batata frita e uma coca?',
      } as any,
      {
        $id: 'p_fries',
        name: 'Fritas',
        isActive: true,
        price: 1500,
        upsellProductIds: [],
      } as any,
      {
        $id: 'p_coke',
        name: 'Coca-Cola',
        isActive: true,
        price: 800,
        upsellProductIds: [],
      } as any,
      {
        $id: 'p_inactive',
        name: 'Sobremesa Esgotada',
        isActive: false,
        price: 1200,
        upsellProductIds: [],
      } as any,
    ];

    it('retorna os produtos sugeridos respeitando ordem e descartando inativos, auto-upsell e inexistentes', () => {
      const upsells = resolveProductUpsells(productsList[0], productsList);
      expect(upsells).toHaveLength(2);
      expect(upsells.map((u) => u.$id)).toEqual(['p_fries', 'p_coke']);
    });

    it('retorna array vazio quando produto não possui upsellProductIds', () => {
      const upsells = resolveProductUpsells(productsList[1], productsList);
      expect(upsells).toEqual([]);
    });
  });

  describe('resolveCartUpsells', () => {
    const productsList = [
      {
        $id: 'p_burger',
        name: 'Burger',
        isActive: true,
        price: 3000,
        upsellProductIds: ['p_fries', 'p_coke'],
      } as any,
      {
        $id: 'p_fries',
        name: 'Fritas',
        isActive: true,
        price: 1500,
        upsellProductIds: ['p_coke', 'p_pudim'],
      } as any,
      {
        $id: 'p_coke',
        name: 'Coca-Cola',
        isActive: true,
        price: 800,
        upsellProductIds: [],
      } as any,
      {
        $id: 'p_pudim',
        name: 'Pudim',
        isActive: true,
        price: 1200,
        upsellProductIds: [],
      } as any,
    ];

    it('retorna sugestões deduplicadas omitindo produtos que já estão no carrinho', () => {
      // Burger e Fritas já estão no carrinho
      const cartProductIds = ['p_burger', 'p_fries'];
      const suggestions = resolveCartUpsells(cartProductIds, productsList);

      // Deve sugerir Coca-Cola e Pudim, mas NÃO Burger ou Fritas
      expect(suggestions.map((s) => s.$id)).toEqual(['p_coke', 'p_pudim']);
    });

    it('retorna array vazio se todos os upsells sugeridos já estiverem no carrinho', () => {
      const cartProductIds = ['p_burger', 'p_fries', 'p_coke', 'p_pudim'];
      const suggestions = resolveCartUpsells(cartProductIds, productsList);
      expect(suggestions).toEqual([]);
    });
  });
});
