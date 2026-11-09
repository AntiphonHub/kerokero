import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMyAccountDocuments, getMyAccountOnboardingUrl } from '@/lib/asaas/documents';

describe('Asaas Documents (KYC) Service', () => {
  const originalFetch = global.fetch;
  const mockSubaccountApiKey = '$aact_subaccount_test_key';

  beforeEach(() => {
    vi.stubEnv('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3');
    vi.stubEnv('ASAAS_API_KEY', 'master_account_key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('retrieves document groups list from GET /myAccount/documents', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'doc_1',
            status: 'PENDING',
            type: 'IDENTIFICATION',
            title: 'Documento de Identificação',
            onboardingUrl: 'https://sandbox.asaas.com/onboarding/xyz123',
          },
          {
            id: 'doc_2',
            status: 'APPROVED',
            type: 'COMPANY_CONTRACT',
            title: 'Contrato Social',
          },
        ],
      }),
    } as Response);

    const docs = await getMyAccountDocuments(mockSubaccountApiKey);

    expect(docs).toHaveLength(2);
    expect(docs[0].id).toBe('doc_1');
    expect(docs[0].status).toBe('PENDING');
    expect(docs[0].onboardingUrl).toBe('https://sandbox.asaas.com/onboarding/xyz123');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/myAccount/documents',
      expect.objectContaining({
        headers: expect.objectContaining({
          access_token: mockSubaccountApiKey,
        }),
      }),
    );
  });

  it('retrieves onboardingUrl from first unapproved document', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'doc_approved',
            status: 'APPROVED',
            type: 'IDENTIFICATION',
            onboardingUrl: 'https://sandbox.asaas.com/onboarding/old',
          },
          {
            id: 'doc_pending',
            status: 'PENDING',
            type: 'FACIAL_BIOMETRY',
            onboardingUrl: 'https://sandbox.asaas.com/onboarding/pending-valid-url',
          },
        ],
      }),
    } as Response);

    const url = await getMyAccountOnboardingUrl(mockSubaccountApiKey);
    expect(url).toBe('https://sandbox.asaas.com/onboarding/pending-valid-url');
  });

  it('returns null when no onboardingUrl is available or all documents are approved', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'doc_1',
            status: 'APPROVED',
            type: 'IDENTIFICATION',
          },
        ],
      }),
    } as Response);

    const url = await getMyAccountOnboardingUrl(mockSubaccountApiKey);
    expect(url).toBeNull();
  });

  it('handles network error gracefully and returns empty array', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const docs = await getMyAccountDocuments(mockSubaccountApiKey);
    expect(docs).toEqual([]);
  });
});

