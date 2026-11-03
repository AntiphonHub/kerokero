import type { ProductDocument, CategoryDocument } from '@/lib/appwrite/products';
import type { CartItem } from '@/lib/store/cart-store';
import type { CartItemInput } from '@/actions/client';

/**
 * Retorna o preço base efetivo do produto (considera happyHourPrice se existir e for válido).
 */
export function getEffectiveProductPrice(product: Pick<ProductDocument, 'price' | 'happyHourPrice'>): number {
  if (product.happyHourPrice != null && product.happyHourPrice > 0) {
    return product.happyHourPrice;
  }
  return product.price;
}

/**
 * Calcula o preço unitário final do item incluindo adicionais selecionados.
 */
export function calculateCustomizedUnitPrice(
  basePrice: number,
  selectedAddons: Array<{ price: number }> = [],
): number {
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  return basePrice + addonsTotal;
}

/**
 * Calcula o total de um item multiplicado pela sua quantidade.
 */
export function calculateItemTotal(unitPrice: number, quantity: number): number {
  const safeQty = Math.max(1, Math.floor(quantity || 1));
  return unitPrice * safeQty;
}

/**
 * Normaliza strings para busca sem acentos e em minúsculas.
 */
function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Filtra a lista de produtos com base na categoria ativa e no termo de busca.
 * Apenas produtos com isActive !== false são retornados.
 */
export function filterProducts(
  products: ProductDocument[],
  categoryId?: string | null,
  searchQuery?: string,
): ProductDocument[] {
  if (!Array.isArray(products)) return [];

  const trimmedQuery = searchQuery ? normalizeSearchText(searchQuery.trim()) : '';
  const isCategoryFilterActive = Boolean(categoryId && categoryId !== 'all');

  return products.filter((prod) => {
    // 1. Filtrar inativos
    if (prod.isActive === false) {
      return false;
    }

    // 2. Filtrar por categoria
    if (isCategoryFilterActive && prod.categoryId !== categoryId) {
      return false;
    }

    // 3. Filtrar por termo de busca
    if (trimmedQuery) {
      const nameMatch = normalizeSearchText(prod.name || '').includes(trimmedQuery);
      const descMatch = normalizeSearchText(prod.description || '').includes(trimmedQuery);
      if (!nameMatch && !descMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Converte itens do carrinho do cliente para o payload exigido pela Server Action submitOrderAction.
 */
export function mapCartItemsToOrderInput(items: CartItem[]): CartItemInput[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const input: CartItemInput = {
      productId: item.productId,
      productName: item.name,
      unitPrice: item.priceCents,
      quantity: item.quantity,
    };

    if (item.notes && item.notes.trim().length > 0) {
      input.notes = item.notes.trim();
    }

    if (item.selectedOptions && item.selectedOptions.length > 0) {
      input.selectedOptions = item.selectedOptions;
    }

    return input;
  });
}
