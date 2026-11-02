import { z } from 'zod';

export const productAddonSchema = z.object({
  id: z.string().min(1, 'ID do adicional é obrigatório'),
  name: z.string().trim().min(1, 'Nome do adicional é obrigatório').max(60, 'Nome muito longo'),
  price: z.number().int().min(0, 'Preço do adicional não pode ser negativo'),
});

export type ProductAddon = z.infer<typeof productAddonSchema>;

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome deve conter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
    description: z.string().trim().max(300, 'Descrição não pode exceder 300 caracteres').optional(),
    imageUrl: z
      .string()
      .trim()
      .refine(
        (val) => !val || val.startsWith('/') || /^https?:\/\//i.test(val),
        'URL ou caminho de imagem inválido',
      )
      .optional(),
    price: z.number().int().positive('Preço regular deve ser maior que zero'),
    happyHourPrice: z.number().int().positive('Preço happy hour deve ser maior que zero').optional().nullable(),
    stockQuantity: z.number().int().min(0, 'Quantidade em estoque não pode ser negativa').optional().nullable(),
    categoryId: z.string().min(1, 'Categoria é obrigatória'),
    categoryName: z.string().trim().min(1, 'Nome da categoria é obrigatório'),
    isActive: z.boolean().default(true),
    addons: z.array(productAddonSchema).default([]),
    upsellProductIds: z.array(z.string()).default([]),
    upsellMessage: z.string().trim().max(120, 'Mensagem de upsell não pode exceder 120 caracteres').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.happyHourPrice != null && data.happyHourPrice >= data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'O preço de Happy Hour deve ser menor que o preço regular',
      path: ['happyHourPrice'],
    },
  );

export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, 'Nome da categoria deve conter ao menos 2 caracteres').max(50, 'Nome muito longo'),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
