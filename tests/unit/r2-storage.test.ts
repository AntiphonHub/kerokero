import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateKycKey, uploadKycDocument } from '@/lib/r2/storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

vi.mock('@aws-sdk/client-s3', () => {
  const sendMock = vi.fn().mockResolvedValue({});
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    PutObjectCommand: vi.fn().mockImplementation((args) => args),
    sendMock,
  };
});

describe('Cloudflare R2 Storage', () => {
  beforeEach(() => {
    vi.stubEnv('R2_ACCOUNT_ID', 'fake_account_id');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'fake_access_key');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'fake_secret_key');
    vi.stubEnv('R2_BUCKET_NAME', 'kerokero-documents');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('generateKycKey', () => {
    it('should generate structured secure key path for KYC files', () => {
      const key = generateKycKey('est_123', 'cnh', 'documento.pdf');
      expect(key).toMatch(/^establishments\/est_123\/kyc\/cnh_\d+_[a-z0-9]+\.pdf$/);
    });

    it('should sanitize file extension', () => {
      const key = generateKycKey('est_123', 'cnpj', 'CONTRATO.JPG');
      expect(key.endsWith('.jpg')).toBe(true);
    });
  });

  describe('uploadKycDocument', () => {
    it('should upload buffer to R2 bucket with content type', async () => {
      const buffer = Buffer.from('dummy pdf content');
      const key = 'establishments/est_123/kyc/cnh_test.pdf';

      const result = await uploadKycDocument(key, buffer, 'application/pdf');

      expect(result).toBe(key);
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'kerokero-documents',
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        }),
      );
    });
  });
});
