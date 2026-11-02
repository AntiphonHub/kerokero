import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from './client';

export function generateKycKey(
  establishmentId: string,
  docType: 'cnh' | 'cnpj',
  originalFileName: string,
): string {
  const extMatch = originalFileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  return `establishments/${establishmentId}/kyc/${docType}_${timestamp}_${randomStr}.${ext}`;
}

export async function uploadKycDocument(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME || 'kerokero-documents';
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
  return key;
}

export function generateProductImageKey(
  establishmentId: string,
  originalFileName: string,
): string {
  const extMatch = originalFileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'webp';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  return `establishments/${establishmentId}/products/prod_${timestamp}_${randomStr}.${ext}`;
}

export async function uploadProductImage(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME || 'kerokero-documents';
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  const publicUrl = process.env.NEXT_PUBLIC_R2_URL || process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, '')}/${key}`;
  }

  return `/api/storage?key=${encodeURIComponent(key)}`;
}

export async function getR2Object(key: string): Promise<{
  body: Uint8Array;
  contentType: string;
} | null> {
  const bucketName = process.env.R2_BUCKET_NAME || 'kerokero-documents';
  const client = getR2Client();

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const res = await client.send(command);
    if (!res.Body) return null;
    const body = await res.Body.transformToByteArray();
    return {
      body,
      contentType: res.ContentType || 'application/octet-stream',
    };
  } catch {
    return null;
  }
}
