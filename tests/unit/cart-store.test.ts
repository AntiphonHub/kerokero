import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cartStore, type CartItem } from '@/lib/store/cart-store';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset cart before each test
    cartStore.clearCart();
    cartStore.setTableToken(null);
  });

  describe('Initial State', () => {
    it('starts with an empty cart and zero totals', () => {
      const state = cartStore.getState();
      expect(state.items).toEqual([]);
      expect(cartStore.getTotalCents()).toBe(0);
      expect(cartStore.getItemCount()).toBe(0);
    });
  });

  describe('Adding Items', () => {
    it('adds a new item to the cart', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });
      expect(state.items[0].id).toBeDefined();
      expect(cartStore.getTotalCents()).toBe(3500);
      expect(cartStore.getItemCount()).toBe(1);
    });

    it('increments quantity when adding the identical product without notes or options', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 2,
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
      expect(cartStore.getTotalCents()).toBe(10500);
      expect(cartStore.getItemCount()).toBe(3);
    });

    it('treats items with different notes as distinct items', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        notes: 'Sem cebola',
      });

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        notes: 'Ao ponto pra mal',
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(cartStore.getItemCount()).toBe(2);
      expect(cartStore.getTotalCents()).toBe(7000);
    });

    it('treats items with identical notes as the same item', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        notes: 'Sem picles',
      });

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        notes: '  Sem picles  ', // should trim and match
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('treats items with different selected options as distinct items', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        selectedOptions: ['bacon', 'cheddar'],
      });

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        selectedOptions: ['bacon'],
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(2);
    });

    it('treats items with same options in different order as the same item', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
        selectedOptions: ['cheddar', 'bacon'],
      });

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 2,
        selectedOptions: ['bacon', 'cheddar'],
      });

      const state = cartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
    });

    it('defaults quantity to 1 if not provided or 0', () => {
      cartStore.addItem({
        productId: 'prod-2',
        name: 'Refrigerante Cola',
        priceCents: 800,
        quantity: 0,
      });

      const state = cartStore.getState();
      expect(state.items[0].quantity).toBe(1);
    });
  });

  describe('Removing Items', () => {
    it('removes item by its id', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      const itemId = cartStore.getState().items[0].id;
      cartStore.removeItem(itemId);

      expect(cartStore.getState().items).toHaveLength(0);
      expect(cartStore.getTotalCents()).toBe(0);
    });

    it('does nothing when removing non-existent id', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      cartStore.removeItem('non-existent');
      expect(cartStore.getState().items).toHaveLength(1);
    });
  });

  describe('Updating Quantities', () => {
    it('updates quantity of an existing item', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      const itemId = cartStore.getState().items[0].id;
      cartStore.updateQuantity(itemId, 5);

      expect(cartStore.getState().items[0].quantity).toBe(5);
      expect(cartStore.getTotalCents()).toBe(17500);
      expect(cartStore.getItemCount()).toBe(5);
    });

    it('removes item if updated quantity is 0', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 2,
      });

      const itemId = cartStore.getState().items[0].id;
      cartStore.updateQuantity(itemId, 0);

      expect(cartStore.getState().items).toHaveLength(0);
      expect(cartStore.getTotalCents()).toBe(0);
      expect(cartStore.getItemCount()).toBe(0);
    });

    it('removes item if updated quantity is negative', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 2,
      });

      const itemId = cartStore.getState().items[0].id;
      cartStore.updateQuantity(itemId, -1);

      expect(cartStore.getState().items).toHaveLength(0);
    });
  });

  describe('Clearing Cart', () => {
    it('removes all items and resets totals', () => {
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 2,
      });
      cartStore.addItem({
        productId: 'prod-2',
        name: 'Batata Frita',
        priceCents: 1500,
        quantity: 1,
      });

      expect(cartStore.getItemCount()).toBe(3);
      expect(cartStore.getTotalCents()).toBe(8500);

      cartStore.clearCart();

      expect(cartStore.getState().items).toHaveLength(0);
      expect(cartStore.getItemCount()).toBe(0);
      expect(cartStore.getTotalCents()).toBe(0);
    });
  });

  describe('Observer Subscriptions', () => {
    it('notifies subscribers on state mutations', () => {
      const listener = vi.fn();
      const unsubscribe = cartStore.subscribe(listener);

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      expect(listener).toHaveBeenCalledTimes(1);

      const itemId = cartStore.getState().items[0].id;
      cartStore.updateQuantity(itemId, 2);
      expect(listener).toHaveBeenCalledTimes(2);

      cartStore.removeItem(itemId);
      expect(listener).toHaveBeenCalledTimes(3);

      unsubscribe();
      cartStore.addItem({
        productId: 'prod-2',
        name: 'Batata',
        priceCents: 1000,
        quantity: 1,
      });
      expect(listener).toHaveBeenCalledTimes(3); // No more calls after unsubscribe
    });
  });

  describe('SessionStorage Persistence & Table Token Scoping', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      const storageMock = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
      };

      vi.stubGlobal('sessionStorage', storageMock);
      vi.stubGlobal('window', { sessionStorage: storageMock });
    });

    it('persists items to sessionStorage scoped by table token', () => {
      cartStore.setTableToken('tbl_tok_123');

      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      const stored = mockStorage['kerokero_cart_tbl_tok_123'];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].productId).toBe('prod-1');
    });

    it('switches table token and restores scoped cart', () => {
      // Preload token 2 with an item
      const item2: CartItem = {
        id: 'item-2',
        productId: 'prod-2',
        name: 'Cerveja Artesanal',
        priceCents: 1800,
        quantity: 2,
      };
      mockStorage['kerokero_cart_tbl_tok_456'] = JSON.stringify([item2]);

      // Set token 1 and add item
      cartStore.setTableToken('tbl_tok_123');
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      expect(cartStore.getState().items).toHaveLength(1);
      expect(cartStore.getState().items[0].productId).toBe('prod-1');

      // Switch to token 2
      cartStore.setTableToken('tbl_tok_456');
      expect(cartStore.getState().items).toHaveLength(1);
      expect(cartStore.getState().items[0].productId).toBe('prod-2');
      expect(cartStore.getTotalCents()).toBe(3600);

      // Switch back to token 1
      cartStore.setTableToken('tbl_tok_123');
      expect(cartStore.getState().items).toHaveLength(1);
      expect(cartStore.getState().items[0].productId).toBe('prod-1');
    });

    it('clears persisted storage on clearCart', () => {
      cartStore.setTableToken('tbl_tok_123');
      cartStore.addItem({
        productId: 'prod-1',
        name: 'Burger Clássico',
        priceCents: 3500,
        quantity: 1,
      });

      expect(mockStorage['kerokero_cart_tbl_tok_123']).toBeDefined();

      cartStore.clearCart();
      const stored = mockStorage['kerokero_cart_tbl_tok_123'];
      expect(stored === null || stored === '[]' || stored === undefined).toBe(true);
    });
  });
});
