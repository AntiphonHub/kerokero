import { ID, Query, Models } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import { ProductInput, ProductAddon } from '@/lib/schemas/product';

export interface CategoryDocument extends Models.DefaultDocument {
  establishmentId: string;
  name: string;
  order?: number;
}

export interface ProductDocument extends Omit<Models.DefaultDocument, 'description'> {
  establishmentId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  happyHourPrice?: number | null;
  stockQuantity?: number | null;
  isActive: boolean;
  addons: ProductAddon[];
  upsellProductIds: string[];
  upsellMessage?: string | null;
}

function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function parseProductDocument(raw: Record<string, unknown>): ProductDocument {
  const plain = toPlainObject<Record<string, unknown>>(raw);
  let parsedAddons: ProductAddon[] = [];
  if (typeof plain.addons === 'string') {
    try {
      parsedAddons = JSON.parse(plain.addons);
    } catch {
      parsedAddons = [];
    }
  } else if (Array.isArray(plain.addons)) {
    parsedAddons = plain.addons as ProductAddon[];
  }

  let upsellIds: string[] = [];
  if (Array.isArray(plain.upsellProductIds)) {
    upsellIds = plain.upsellProductIds as string[];
  }

  return {
    ...(plain as unknown as Models.DefaultDocument),
    establishmentId: String(plain.establishmentId || ''),
    categoryId: String(plain.categoryId || ''),
    categoryName: String(plain.categoryName || ''),
    name: String(plain.name || ''),
    description: plain.description ? String(plain.description) : '',
    imageUrl: plain.imageUrl ? String(plain.imageUrl) : '',
    price: Number(plain.price || 0),
    happyHourPrice: plain.happyHourPrice != null ? Number(plain.happyHourPrice) : null,
    stockQuantity: plain.stockQuantity != null ? Number(plain.stockQuantity) : null,
    isActive: plain.isActive !== false,
    addons: parsedAddons,
    upsellProductIds: upsellIds,
    upsellMessage: plain.upsellMessage ? String(plain.upsellMessage) : null,
  };
}

export async function getCategoriesByEstablishment(
  establishmentId: string,
): Promise<CategoryDocument[]> {
  const { databases } = createAdminClient();
  try {
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.categories,
      [
        Query.equal('establishmentId', establishmentId),
        Query.orderAsc('name'),
        Query.limit(100),
      ],
    );

    return res.documents.map((doc) => toPlainObject<CategoryDocument>(doc));
  } catch (error: any) {
    if (error?.code === 404 || error?.type === 'collection_not_found') {
      console.warn(`[Appwrite] Categories collection not found. Returning empty list.`);
      return [];
    }
    throw error;
  }
}

export async function createCategory(
  establishmentId: string,
  name: string,
): Promise<CategoryDocument> {
  const trimmed = name.trim();
  const { databases } = createAdminClient();

  const existingRes = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.categories,
    [Query.equal('establishmentId', establishmentId), Query.limit(100)],
  );

  const found = existingRes.documents.find(
    (doc) => (doc.name as string).trim().toLowerCase() === trimmed.toLowerCase(),
  );

  if (found) {
    return toPlainObject<CategoryDocument>(found);
  }

  const created = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.categories,
    ID.unique(),
    {
      establishmentId,
      name: trimmed,
      order: existingRes.total,
    },
  );

  return toPlainObject<CategoryDocument>(created);
}

export async function getProductsByEstablishment(
  establishmentId: string,
): Promise<ProductDocument[]> {
  const { databases } = createAdminClient();
  try {
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.products,
      [
        Query.equal('establishmentId', establishmentId),
        Query.orderDesc('$createdAt'),
        Query.limit(200),
      ],
    );

    return res.documents.map((doc) => parseProductDocument(doc));
  } catch (error: any) {
    if (error?.code === 404 || error?.type === 'collection_not_found') {
      console.warn(`[Appwrite] Products collection not found. Returning empty list.`);
      return [];
    }
    throw error;
  }
}

export async function getProductById(
  establishmentId: string,
  productId: string,
): Promise<ProductDocument | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.products,
      productId,
    );

    if (doc.establishmentId !== establishmentId) {
      return null;
    }

    return parseProductDocument(doc);
  } catch {
    return null;
  }
}

export async function createProduct(
  establishmentId: string,
  data: ProductInput,
): Promise<ProductDocument> {
  const { databases } = createAdminClient();

  const payload = {
    establishmentId,
    name: data.name.trim(),
    description: data.description?.trim() || '',
    imageUrl: data.imageUrl || '',
    price: data.price,
    happyHourPrice: data.happyHourPrice ?? null,
    stockQuantity: data.stockQuantity ?? null,
    categoryId: data.categoryId,
    categoryName: data.categoryName.trim(),
    isActive: data.isActive,
    addons: JSON.stringify(data.addons || []),
    upsellProductIds: data.upsellProductIds || [],
    upsellMessage: data.upsellMessage ? data.upsellMessage.trim() : null,
  };

  const created = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    ID.unique(),
    payload,
  );

  return parseProductDocument(created);
}

export async function updateProduct(
  establishmentId: string,
  productId: string,
  data: Partial<ProductInput>,
): Promise<ProductDocument> {
  const { databases } = createAdminClient();
  const existing = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    productId,
  );

  if (existing.establishmentId !== establishmentId) {
    throw new Error('Produto não pertence a este estabelecimento');
  }

  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.description !== undefined) payload.description = data.description.trim();
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (data.price !== undefined) payload.price = data.price;
  if (data.happyHourPrice !== undefined) payload.happyHourPrice = data.happyHourPrice;
  if (data.stockQuantity !== undefined) payload.stockQuantity = data.stockQuantity;
  if (data.categoryId !== undefined) payload.categoryId = data.categoryId;
  if (data.categoryName !== undefined) payload.categoryName = data.categoryName.trim();
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.addons !== undefined) payload.addons = JSON.stringify(data.addons);
  if (data.upsellProductIds !== undefined) payload.upsellProductIds = data.upsellProductIds;
  if (data.upsellMessage !== undefined) payload.upsellMessage = data.upsellMessage ? data.upsellMessage.trim() : null;

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    productId,
    payload,
  );

  return parseProductDocument(updated);
}

export async function deleteProduct(
  establishmentId: string,
  productId: string,
): Promise<boolean> {
  const { databases } = createAdminClient();
  const existing = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    productId,
  );

  if (existing.establishmentId !== establishmentId) {
    throw new Error('Produto não pertence a este estabelecimento');
  }

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    productId,
  );

  return true;
}

export async function toggleProductStatus(
  establishmentId: string,
  productId: string,
): Promise<ProductDocument> {
  const { databases } = createAdminClient();
  const existing = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    productId,
  );

  if (existing.establishmentId !== establishmentId) {
    throw new Error('Produto não pertence a este estabelecimento');
  }

  const nextStatus = !existing.isActive;

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.products,
    productId,
    { isActive: nextStatus },
  );

  return parseProductDocument(updated);
}
