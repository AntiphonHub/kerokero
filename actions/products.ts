'use server';

import { revalidatePath } from 'next/cache';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  createCategory,
  ProductDocument,
  CategoryDocument,
} from '@/lib/appwrite/products';
import {
  productInputSchema,
  categoryInputSchema,
  ProductInput,
} from '@/lib/schemas/product';
import { generateProductImageKey, uploadProductImage } from '@/lib/r2/storage';

export interface ProductActionResult {
  success: boolean;
  message?: string;
  product?: ProductDocument;
  category?: CategoryDocument;
  imageUrl?: string;
  errors?: Record<string, string[]>;
}

async function getAuthorizedEstablishment() {
  const user = await getLoggedInUser();
  if (!user) {
    return { user: null, establishment: null };
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  return { user, establishment };
}

export async function saveProductAction(
  rawInput: unknown,
  productId?: string,
): Promise<ProductActionResult> {
  try {
    const { user, establishment } = await getAuthorizedEstablishment();
    if (!user || !establishment) {
      return {
        success: false,
        message: 'Usuário não autenticado ou estabelecimento não encontrado.',
      };
    }

    const parseResult = productInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const firstErrorMessage = parseResult.error.issues[0]?.message;
      return {
        success: false,
        message: firstErrorMessage || 'Dados do produto inválidos.',
        errors: fieldErrors,
      };
    }

    const data: ProductInput = parseResult.data;

    let saved: ProductDocument;
    if (productId) {
      saved = await updateProduct(establishment.$id, productId, data);
    } else {
      saved = await createProduct(establishment.$id, data);
    }

    revalidatePath('/menu');
    return {
      success: true,
      message: productId ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.',
      product: saved,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao salvar produto.';
    return { success: false, message: msg };
  }
}

export async function deleteProductAction(productId: string): Promise<ProductActionResult> {
  try {
    const { user, establishment } = await getAuthorizedEstablishment();
    if (!user || !establishment) {
      return {
        success: false,
        message: 'Usuário não autenticado ou estabelecimento não encontrado.',
      };
    }

    await deleteProduct(establishment.$id, productId);
    revalidatePath('/menu');

    return {
      success: true,
      message: 'Produto removido com sucesso.',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao remover produto.';
    return { success: false, message: msg };
  }
}

export async function toggleProductStatusAction(productId: string): Promise<ProductActionResult> {
  try {
    const { user, establishment } = await getAuthorizedEstablishment();
    if (!user || !establishment) {
      return {
        success: false,
        message: 'Usuário não autenticado ou estabelecimento não encontrado.',
      };
    }

    const updated = await toggleProductStatus(establishment.$id, productId);
    revalidatePath('/menu');

    return {
      success: true,
      message: updated.isActive ? 'Produto ativado.' : 'Produto desativado.',
      product: updated,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao alterar status do produto.';
    return { success: false, message: msg };
  }
}

export async function createCategoryAction(name: string): Promise<ProductActionResult> {
  try {
    const { user, establishment } = await getAuthorizedEstablishment();
    if (!user || !establishment) {
      return {
        success: false,
        message: 'Usuário não autenticado ou estabelecimento não encontrado.',
      };
    }

    const parsed = categoryInputSchema.safeParse({ name });
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || 'Nome da categoria inválido.',
      };
    }

    const category = await createCategory(establishment.$id, parsed.data.name);
    revalidatePath('/menu');

    return {
      success: true,
      category,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao criar categoria.';
    return { success: false, message: msg };
  }
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<ProductActionResult> {
  try {
    const { user, establishment } = await getAuthorizedEstablishment();
    if (!user || !establishment) {
      return {
        success: false,
        message: 'Usuário não autenticado.',
      };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return {
        success: false,
        message: 'Nenhum arquivo enviado.',
      };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: 'Formato inválido. Envie uma imagem JPEG, PNG, WebP ou AVIF.',
      };
    }

    // 5MB max
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: 'Imagem muito pesada. O tamanho máximo permitido é 5MB.',
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateProductImageKey(establishment.$id, file.name);
    const imageUrl = await uploadProductImage(key, buffer, file.type);

    return {
      success: true,
      imageUrl,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem.';
    return { success: false, message: msg };
  }
}
