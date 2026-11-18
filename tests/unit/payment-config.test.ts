import { describe, it, expect, afterEach } from 'vitest';
import { isPixPaymentEnabled } from '@/lib/config/payment';

describe('Payment Configuration & PIX Feature Flag', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT;

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT = originalEnv;
  });

  it('defaults to false when NEXT_PUBLIC_ENABLE_PIX_PAYMENT is not set', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT;
    expect(isPixPaymentEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_ENABLE_PIX_PAYMENT is empty or whitespace', () => {
    process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT = '   ';
    expect(isPixPaymentEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_ENABLE_PIX_PAYMENT is explicitly set to false', () => {
    process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT = 'false';
    expect(isPixPaymentEnabled()).toBe(false);
  });

  it('returns true when NEXT_PUBLIC_ENABLE_PIX_PAYMENT is set to true', () => {
    process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT = 'true';
    expect(isPixPaymentEnabled()).toBe(true);
  });

  it('handles uppercase and trimmed values like " TRUE " or "1"', () => {
    process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT = ' TRUE ';
    expect(isPixPaymentEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT = '1';
    expect(isPixPaymentEnabled()).toBe(true);
  });
});
