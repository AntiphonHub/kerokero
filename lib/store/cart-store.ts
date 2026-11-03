'use client';

import { useSyncExternalStore, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
  selectedOptions?: string[];
}

export type AddCartItemInput = Omit<CartItem, 'id'> & { id?: string };

export interface CartStoreState {
  items: CartItem[];
  tableToken: string | null;
}

const STORAGE_PREFIX = 'kerokero_cart_';
const SERVER_SNAPSHOT: CartStoreState = { items: [], tableToken: null };

function normalizeNotes(notes?: string): string {
  return (notes || '').trim();
}

function normalizeOptions(options?: string[]): string[] {
  if (!options || options.length === 0) return [];
  return [...options].sort();
}

function optionsKey(options?: string[]): string {
  return normalizeOptions(options).join('||');
}

function areOptionsEqual(a?: string[], b?: string[]): boolean {
  return optionsKey(a) === optionsKey(b);
}

function areItemsEqual(a: CartItem, b: AddCartItemInput): boolean {
  if (b.id && a.id === b.id) return true;
  return (
    a.productId === b.productId &&
    normalizeNotes(a.notes) === normalizeNotes(b.notes) &&
    areOptionsEqual(a.selectedOptions, b.selectedOptions)
  );
}

function generateItemId(item: AddCartItemInput): string {
  if (item.id) return item.id;
  const opts = optionsKey(item.selectedOptions);
  const notes = normalizeNotes(item.notes);
  return `${item.productId}:${opts}:${notes}:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getStorageKey(tableToken: string | null): string {
  return `${STORAGE_PREFIX}${tableToken || 'default'}`;
}

function loadPersistedItems(tableToken: string | null): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage?.getItem(getStorageKey(tableToken));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore storage parse or access errors
  }
  return [];
}

function persistItems(tableToken: string | null, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(tableToken);
    if (items.length === 0) {
      window.sessionStorage?.removeItem(key);
    } else {
      window.sessionStorage?.setItem(key, JSON.stringify(items));
    }
  } catch {
    // Ignore storage quota or access errors
  }
}

// In-memory store state
let currentTableToken: string | null = null;
let currentItems: CartItem[] = [];
let stateSnapshot: CartStoreState = { items: currentItems, tableToken: currentTableToken };

const listeners = new Set<() => void>();

function notify(): void {
  stateSnapshot = { items: [...currentItems], tableToken: currentTableToken };
  persistItems(currentTableToken, currentItems);
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error in cartStore listener:', err);
    }
  });
}

export const cartStore = {
  getState(): CartStoreState {
    return stateSnapshot;
  },

  getServerState(): CartStoreState {
    return SERVER_SNAPSHOT;
  },

  getTableToken(): string | null {
    return currentTableToken;
  },

  setTableToken(token: string | null): void {
    if (currentTableToken === token) return;
    currentTableToken = token;
    currentItems = loadPersistedItems(token);
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  addItem(item: AddCartItemInput): void {
    const qtyToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const existingIndex = currentItems.findIndex((existing) => areItemsEqual(existing, item));

    if (existingIndex >= 0) {
      const existing = currentItems[existingIndex];
      currentItems = [
        ...currentItems.slice(0, existingIndex),
        { ...existing, quantity: existing.quantity + qtyToAdd },
        ...currentItems.slice(existingIndex + 1),
      ];
    } else {
      const normalizedNotes = normalizeNotes(item.notes);
      const normalizedSelectedOptions =
        item.selectedOptions && item.selectedOptions.length > 0
          ? [...item.selectedOptions]
          : undefined;

      const newItem: CartItem = {
        id: generateItemId(item),
        productId: item.productId,
        name: item.name,
        priceCents: item.priceCents,
        quantity: qtyToAdd,
        notes: normalizedNotes || undefined,
        selectedOptions: normalizedSelectedOptions,
      };
      currentItems = [...currentItems, newItem];
    }

    notify();
  },

  removeItem(id: string): void {
    const filtered = currentItems.filter((item) => item.id !== id);
    if (filtered.length !== currentItems.length) {
      currentItems = filtered;
      notify();
    }
  },

  updateQuantity(id: string, quantity: number): void {
    if (quantity <= 0) {
      cartStore.removeItem(id);
      return;
    }
    const index = currentItems.findIndex((item) => item.id === id);
    if (index >= 0) {
      currentItems = [
        ...currentItems.slice(0, index),
        { ...currentItems[index], quantity },
        ...currentItems.slice(index + 1),
      ];
      notify();
    }
  },

  clearCart(): void {
    currentItems = [];
    notify();
  },

  getTotalCents(): number {
    return currentItems.reduce((acc, item) => acc + item.priceCents * item.quantity, 0);
  },

  getItemCount(): number {
    return currentItems.reduce((acc, item) => acc + item.quantity, 0);
  },
};

export function useCartStore(tableToken?: string) {
  useEffect(() => {
    if (tableToken && tableToken !== cartStore.getTableToken()) {
      cartStore.setTableToken(tableToken);
    }
  }, [tableToken]);

  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getState,
    cartStore.getServerState
  );

  return {
    items: state.items,
    tableToken: state.tableToken,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
    getTotalCents: cartStore.getTotalCents,
    getItemCount: cartStore.getItemCount,
    setTableToken: cartStore.setTableToken,
    cartTotalCents: cartStore.getTotalCents(),
    totalCents: cartStore.getTotalCents(),
    itemCount: cartStore.getItemCount(),
  };
}
