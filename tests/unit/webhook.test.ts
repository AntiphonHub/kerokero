import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyWebhookToken, parseWebhookEvent } from '@/lib/asaas/webhook';

describe('Asaas Webhook Security & Parsing', () => {
  beforeEach(() => {
    vi.stubEnv('ASAAS_WEBHOOK_TOKEN', 'super_secret_webhook_token_123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('verifyWebhookToken', () => {
    it('should return true when token matches exactly', () => {
      expect(verifyWebhookToken('super_secret_webhook_token_123')).toBe(true);
    });

    it('should return false when token is invalid or missing', () => {
      expect(verifyWebhookToken('wrong_token')).toBe(false);
      expect(verifyWebhookToken(null)).toBe(false);
      expect(verifyWebhookToken(undefined)).toBe(false);
      expect(verifyWebhookToken('')).toBe(false);
    });
  });

  describe('parseWebhookEvent', () => {
    it('should correctly parse PAYMENT_CONFIRMED event', () => {
      const payload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_123',
          customer: 'cus_456',
          subscription: 'sub_789',
          value: 149.0,
          status: 'CONFIRMED',
        },
      };

      const parsed = parseWebhookEvent(payload);
      expect(parsed.event).toBe('PAYMENT_CONFIRMED');
      expect(parsed.payment?.subscription).toBe('sub_789');
      expect(parsed.isPaymentConfirmed).toBe(true);
    });

    it('should identify overdue and deletion events', () => {
      const overdue = parseWebhookEvent({
        event: 'PAYMENT_OVERDUE',
        payment: { id: 'pay_123', subscription: 'sub_789', status: 'OVERDUE' },
      });
      expect(overdue.isPaymentOverdue).toBe(true);

      const deleted = parseWebhookEvent({
        event: 'PAYMENT_DELETED',
        payment: { id: 'pay_123', subscription: 'sub_789', status: 'DELETED' },
      });
      expect(deleted.isPaymentDeleted).toBe(true);
    });
  });
});
