import { describe, it, expect } from 'vitest';
import {
  productInputSchema,
  productAddonSchema,
  categoryInputSchema,
} from '@/lib/schemas/product';

describe('productAddonSchema', () => {
  it('deve validar um adicional correto', () => {
    const valid = {
      id: 'addon_1',
      name: 'Bacon Extra',
      price: 500, // R$ 5,00
    };
    const result = productAddonSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar adicional com preço negativo', () => {
    const invalid = {
      id: 'addon_1',
      name: 'Molho',
      price: -100,
    };
    const result = productAddonSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar adicional com nome vazio', () => {
    const invalid = {
      id: 'addon_1',
      name: '',
      price: 0,
    };
    const result = productAddonSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('categoryInputSchema', () => {
  it('deve validar categoria com nome válido', () => {
    const result = categoryInputSchema.safeParse({ name: 'Hambúrgueres Artesanais' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Hambúrgueres Artesanais');
    }
  });

  it('deve rejeitar nome de categoria com menos de 2 caracteres', () => {
    const result = categoryInputSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });
});

describe('productInputSchema', () => {
  const baseValidProduct = {
    name: 'X-Burger Especial',
    description: 'Pão brioche, hambúrguer 180g e queijo prato',
    imageUrl: 'https://cdn.bempedi.com/products/burger.jpg',
    price: 3200, // R$ 32,00
    happyHourPrice: 2800, // R$ 28,00
    stockQuantity: 20,
    categoryId: 'cat_burgers',
    categoryName: 'Hambúrgueres',
    isActive: true,
    addons: [
      { id: 'add_1', name: 'Bacon fatiado', price: 400 },
    ],
    upsellProductIds: ['prod_fritas', 'prod_coca'],
    upsellMessage: 'Vai uma batata frita para acompanhar?',
  };

  it('deve validar produto completo com happy hour e adicionais', () => {
    const result = productInputSchema.safeParse(baseValidProduct);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar mensagem de upsell com mais de 120 caracteres', () => {
    const longMsg = 'A'.repeat(121);
    const product = { ...baseValidProduct, upsellMessage: longMsg };
    const result = productInputSchema.safeParse(product);
    expect(result.success).toBe(false);
  });

  it('deve aceitar imagem com caminho relativo de storage (/api/storage?key=...)', () => {
    const product = {
      ...baseValidProduct,
      imageUrl: '/api/storage?key=establishments%2Fest_1%2Fproducts%2Fprod_1.webp',
    };
    const result = productInputSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it('deve validar produto sem happy hour e sem adicionais', () => {
    const product = {
      ...baseValidProduct,
      happyHourPrice: null,
      addons: [],
      upsellProductIds: [],
    };
    const result = productInputSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it('deve validar produto com estoque ilimitado (stockQuantity null ou undefined)', () => {
    const product = {
      ...baseValidProduct,
      stockQuantity: null,
    };
    const result = productInputSchema.safeParse(product);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockQuantity).toBeNull();
    }
  });

  it('deve rejeitar estoque negativo', () => {
    const product = {
      ...baseValidProduct,
      stockQuantity: -5,
    };
    const result = productInputSchema.safeParse(product);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar produto com preço zero ou negativo', () => {
    const productZero = { ...baseValidProduct, price: 0 };
    const productNeg = { ...baseValidProduct, price: -100 };
    expect(productInputSchema.safeParse(productZero).success).toBe(false);
    expect(productInputSchema.safeParse(productNeg).success).toBe(false);
  });

  it('deve rejeitar preço happy hour maior ou igual ao preço regular', () => {
    const productHigherHH = {
      ...baseValidProduct,
      price: 3000,
      happyHourPrice: 3500,
    };
    const productEqualHH = {
      ...baseValidProduct,
      price: 3000,
      happyHourPrice: 3000,
    };

    const resHigher = productInputSchema.safeParse(productHigherHH);
    const resEqual = productInputSchema.safeParse(productEqualHH);

    expect(resHigher.success).toBe(false);
    expect(resEqual.success).toBe(false);
  });

  it('deve rejeitar nome muito curto ou categoria vazia', () => {
    const shortName = { ...baseValidProduct, name: 'A' };
    const emptyCat = { ...baseValidProduct, categoryId: '' };

    expect(productInputSchema.safeParse(shortName).success).toBe(false);
    expect(productInputSchema.safeParse(emptyCat).success).toBe(false);
  });
});
