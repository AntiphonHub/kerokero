import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockUsers = {
  get: vi.fn(),
  updatePrefs: vi.fn(),
};

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    users: mockUsers,
  }),
}));

const mockGetEstablishmentBySubscriptionId = vi.fn();
const mockUpdateSubscriptionStatus = vi.fn();

vi.mock('@/lib/appwrite/establishments', () => ({
  getEstablishmentBySubscriptionId: (...args: unknown[]) =>
    mockGetEstablishmentBySubscriptionId(...args),
  updateSubscriptionStatus: (...args: unknown[]) =>
    mockUpdateSubscriptionStatus(...args),
}));

const mockGetAsaasSubscriptionPayments = vi.fn();

vi.mock('@/lib/asaas/subscriptions', () => ({
  getAsaasSubscriptionPayments: (...args: unknown[]) =>
    mockGetAsaasSubscriptionPayments(...args),
}));

import { buildSubscriptionWelcomeEmail } from '@/lib/email/subscription-welcome-template';
import { sendTransactionalEmail } from '@/lib/email/send-email';
import { activateSubscriptionAndNotify } from '@/lib/subscriptions/activation';

describe('Subscription Welcome Email Template', () => {
  it('renders Bempedi-themed congratulatory and support HTML without scripts or emojis', () => {
    const { subject, html } = buildSubscriptionWelcomeEmail({
      ownerName: 'Guilherme Alves',
      establishmentName: 'Cantina Bempedi',
      dashboardUrl: 'https://bempedi.com/dashboard',
      supportEmail: 'contato@bempedi.com',
    });

    expect(subject).toContain('Bempedi');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('https://bempedi.com/images/logo.png');
    expect(html).toContain('#121212');
    expect(html).toContain('#F59E0B');
    expect(html).toContain('#FFFFFF');
    expect(html).toContain('#F4F4F5');
    expect(html).toContain('Guilherme Alves');
    expect(html).toContain('Cantina Bempedi');
    expect(html).toContain('contato@bempedi.com');
    expect(html).toContain('https://bempedi.com/dashboard');
    expect(html).toContain('01');
    expect(html).toContain('02');
    expect(html).toContain('03');
    expect(html).toContain('Acessar meu painel');
    expect(html).toContain('Falar com o suporte');
    expect(html).not.toContain('<script');

    const emojiRegex =
      /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
    expect(emojiRegex.test(subject)).toBe(false);
  });

  it('escapes HTML special characters in owner and establishment names', () => {
    const { html } = buildSubscriptionWelcomeEmail({
      ownerName: '<script>alert(1)</script>',
      establishmentName: 'Bar & "Grill"',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Bar &amp; &quot;Grill&quot;');
  });
});

describe('Transactional Email Sender', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('sends via Resend REST API with Idempotency-Key when RESEND_API_KEY is set', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    vi.stubEnv('RESEND_FROM_EMAIL', 'Bempedi <contato@bempedi.com>');

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_123' }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendTransactionalEmail({
      toEmail: 'lojista@bempedi.com',
      subject: 'Bem-vindo',
      html: '<p>Oi</p>',
      idempotencyKey: 'welcome-sub_1',
    });

    expect(result).toEqual({ sent: true, provider: 'resend', id: 'email_123' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_123',
          'Idempotency-Key': 'welcome-sub_1',
        }),
      }),
    );
  });

  it('handles Resend HTTP errors gracefully without throwing', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => 'Invalid from domain',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendTransactionalEmail({
      toEmail: 'lojista@bempedi.com',
      subject: 'Bem-vindo',
      html: '<p>Oi</p>',
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe('resend');
  });

  it('returns sent: false cleanly when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');

    const result = await sendTransactionalEmail({
      toEmail: 'lojista@bempedi.com',
      subject: 'Bem-vindo',
      html: '<p>Oi</p>',
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe('resend');
    expect(result.reason).toContain('RESEND_API_KEY');
  });
});

describe('activateSubscriptionAndNotify (First-Payment Welcome Email)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_ok' }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('sends welcome email ONCE on first payment (trialing -> active) and persists flag in user prefs', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_1',
      subscriptionStatus: 'trialing',
    });
    mockUpdateSubscriptionStatus.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_1',
      subscriptionStatus: 'active',
    });
    mockUsers.get.mockResolvedValueOnce({
      $id: 'user_1',
      name: 'Maria Silva',
      email: 'maria@bistro.com',
      prefs: { cpf: '12345678900' },
    });
    mockGetAsaasSubscriptionPayments.mockResolvedValueOnce([
      { id: 'pay_1', status: 'RECEIVED', value: 149 },
    ]);
    mockUsers.updatePrefs.mockResolvedValueOnce({});

    const res = await activateSubscriptionAndNotify('sub_1');

    expect(res?.establishment?.subscriptionStatus).toBe('active');
    expect(res?.welcomeEmailSent).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(mockUsers.updatePrefs).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({
        cpf: '12345678900',
        firstSubscriptionEmailSentSubId: 'sub_1',
        firstSubscriptionEmailSentAt: expect.any(String),
      }),
    );
  });

  it('does NOT send email on renewal when previousStatus is already active', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_1',
      subscriptionStatus: 'active',
    });
    mockUpdateSubscriptionStatus.mockResolvedValueOnce({
      $id: 'est_1',
      subscriptionStatus: 'active',
    });

    const res = await activateSubscriptionAndNotify('sub_1');

    expect(res?.welcomeEmailSent).toBe(false);
    expect(mockUsers.get).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does NOT send email if user prefs already recorded firstSubscriptionEmailSentAt (e.g. overdue -> active in month 2)', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_1',
      subscriptionStatus: 'overdue',
    });
    mockUpdateSubscriptionStatus.mockResolvedValueOnce({
      $id: 'est_1',
      subscriptionStatus: 'active',
    });
    mockUsers.get.mockResolvedValueOnce({
      $id: 'user_1',
      name: 'Maria Silva',
      email: 'maria@bistro.com',
      prefs: {
        firstSubscriptionEmailSentAt: '2026-10-12T10:00:00.000Z',
        firstSubscriptionEmailSentSubId: 'sub_1',
      },
    });

    const res = await activateSubscriptionAndNotify('sub_1');

    expect(res?.welcomeEmailSent).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockUsers.updatePrefs).not.toHaveBeenCalled();
  });

  it('does NOT send email if Asaas history already has 2+ confirmed/received payments', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_1',
      subscriptionStatus: 'overdue',
    });
    mockUpdateSubscriptionStatus.mockResolvedValueOnce({
      $id: 'est_1',
      subscriptionStatus: 'active',
    });
    mockUsers.get.mockResolvedValueOnce({
      $id: 'user_1',
      name: 'Maria Silva',
      email: 'maria@bistro.com',
      prefs: {},
    });
    mockGetAsaasSubscriptionPayments.mockResolvedValueOnce([
      { id: 'pay_1', status: 'RECEIVED', value: 149 },
      { id: 'pay_2', status: 'CONFIRMED', value: 149 },
    ]);

    const res = await activateSubscriptionAndNotify('sub_1');

    expect(res?.welcomeEmailSent).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('reuses preloadedPayments without querying Asaas again', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_1',
      subscriptionStatus: 'trialing',
    });
    mockUpdateSubscriptionStatus.mockResolvedValueOnce({
      $id: 'est_1',
      subscriptionStatus: 'active',
    });
    mockUsers.get.mockResolvedValueOnce({
      $id: 'user_1',
      name: 'Maria Silva',
      email: 'maria@bistro.com',
      prefs: {},
    });
    mockUsers.updatePrefs.mockResolvedValueOnce({});

    const res = await activateSubscriptionAndNotify('sub_1', {
      preloadedPayments: [{ id: 'pay_1', status: 'CONFIRMED', value: 149 }],
    });

    expect(res?.welcomeEmailSent).toBe(true);
    expect(mockGetAsaasSubscriptionPayments).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent calls for the same subscriptionId', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValue({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_concurrent',
      subscriptionStatus: 'trialing',
    });
    mockUpdateSubscriptionStatus.mockResolvedValue({
      $id: 'est_1',
      subscriptionStatus: 'active',
    });
    mockUsers.get.mockResolvedValue({
      $id: 'user_1',
      name: 'Maria Silva',
      email: 'maria@bistro.com',
      prefs: {},
    });
    mockGetAsaasSubscriptionPayments.mockResolvedValue([
      { id: 'pay_1', status: 'RECEIVED', value: 149 },
    ]);
    mockUsers.updatePrefs.mockResolvedValue({});

    const [r1, r2] = await Promise.all([
      activateSubscriptionAndNotify('sub_concurrent'),
      activateSubscriptionAndNotify('sub_concurrent'),
    ]);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect([r1?.welcomeEmailSent, r2?.welcomeEmailSent]).toContain(true);
  });

  it('activates subscription even if email fails and leaves prefs unmarked for retry', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Provider down',
    }) as unknown as typeof fetch;

    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce({
      $id: 'est_1',
      userId: 'user_1',
      name: 'Bistrô Bempedi',
      asaasSubscriptionId: 'sub_fail_email',
      subscriptionStatus: 'pending',
    });
    mockUpdateSubscriptionStatus.mockResolvedValueOnce({
      $id: 'est_1',
      subscriptionStatus: 'active',
    });
    mockUsers.get.mockResolvedValueOnce({
      $id: 'user_1',
      name: 'Maria Silva',
      email: 'maria@bistro.com',
      prefs: {},
    });
    mockGetAsaasSubscriptionPayments.mockResolvedValueOnce([
      { id: 'pay_1', status: 'RECEIVED', value: 149 },
    ]);

    const res = await activateSubscriptionAndNotify('sub_fail_email');

    expect(res?.establishment?.subscriptionStatus).toBe('active');
    expect(res?.welcomeEmailSent).toBe(false);
    expect(mockUsers.updatePrefs).not.toHaveBeenCalled();
  });

  it('returns null establishment cleanly when subscriptionId does not exist', async () => {
    mockGetEstablishmentBySubscriptionId.mockResolvedValueOnce(null);

    const res = await activateSubscriptionAndNotify('sub_missing');

    expect(res).toEqual({ establishment: null, welcomeEmailSent: false });
    expect(mockUpdateSubscriptionStatus).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
