import type { ProductDocument } from '@/lib/appwrite/products';
import type { CartItem } from '@/lib/store/cart-store';
import type { CartItemInput } from '@/actions/client';

/**
 * Retorna o preço base efetivo do produto.
 * Aplica happyHourPrice apenas quando isHappyHour for explicitamente true.
 */
export function getEffectiveProductPrice(
  product: Pick<ProductDocument, 'price' | 'happyHourPrice'>,
  isHappyHour: boolean = false,
): number {
  if (
    isHappyHour &&
    product.happyHourPrice != null &&
    product.happyHourPrice > 0 &&
    product.happyHourPrice < product.price
  ) {
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

    // 2. Filtrar por categoria (suporte especial para "happy_hour")
    if (categoryId === 'happy_hour') {
      if (
        prod.happyHourPrice == null ||
        prod.happyHourPrice <= 0 ||
        prod.happyHourPrice >= prod.price
      ) {
        return false;
      }
    } else if (isCategoryFilterActive && prod.categoryId !== categoryId) {
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

/**
 * Resolve os produtos recomendados de upsell de um produto específico,
 * descartando itens inexistentes, inativos e auto-recomendações.
 */
export function resolveProductUpsells(
  product: ProductDocument | null | undefined,
  allProducts: ProductDocument[] = [],
): ProductDocument[] {
  if (!product || !Array.isArray(product.upsellProductIds) || product.upsellProductIds.length === 0) {
    return [];
  }

  const productMap = new Map<string, ProductDocument>();
  for (const p of allProducts) {
    if (p && p.isActive !== false && p.$id !== product.$id) {
      productMap.set(p.$id, p);
    }
  }

  const results: ProductDocument[] = [];
  for (const id of product.upsellProductIds) {
    const item = productMap.get(id);
    if (item) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Resolve os produtos recomendados de upsell para os itens atualmente no carrinho,
 * deduplicando e omitindo itens que já estejam no carrinho.
 */
export function resolveCartUpsells(
  cartProductIds: string[] = [],
  allProducts: ProductDocument[] = [],
): ProductDocument[] {
  if (!Array.isArray(cartProductIds) || cartProductIds.length === 0) {
    return [];
  }

  const cartSet = new Set(cartProductIds);
  const productMap = new Map<string, ProductDocument>();
  for (const p of allProducts) {
    if (p && p.isActive !== false) {
      productMap.set(p.$id, p);
    }
  }

  const suggestedMap = new Map<string, ProductDocument>();

  for (const cartId of cartProductIds) {
    const cartProd = productMap.get(cartId);
    if (cartProd && Array.isArray(cartProd.upsellProductIds)) {
      for (const upsellId of cartProd.upsellProductIds) {
        if (!cartSet.has(upsellId) && !suggestedMap.has(upsellId)) {
          const upsellProd = productMap.get(upsellId);
          if (upsellProd) {
            suggestedMap.set(upsellId, upsellProd);
          }
        }
      }
    }
  }

  return Array.from(suggestedMap.values());
}
