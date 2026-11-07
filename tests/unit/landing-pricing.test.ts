import { describe, it, expect } from 'vitest';
import { PRICING_DATA, formatPricingValue } from '@/lib/landing/pricing-data';

describe('Landing Pricing Data & Helpers', () => {
  it('defines the single flat monthly price of 149 BRL', () => {
    expect(PRICING_DATA.amount).toBe(149);
    expect(PRICING_DATA.period).toBe('/ mês');
    expect(formatPricingValue(PRICING_DATA.amount)).toBe('R$ 149');
  });

  it('contains clear, direct copy without emojis', () => {
    expect(PRICING_DATA.title).toBeDefined();
    expect(PRICING_DATA.description).toBeDefined();

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(PRICING_DATA.title)).toBe(false);
    expect(emojiRegex.test(PRICING_DATA.description)).toBe(false);

    for (const item of PRICING_DATA.includedFeatures) {
      expect(emojiRegex.test(item)).toBe(false);
    }
  });

  it('includes all key platform features without tier fragmentation', () => {
    expect(PRICING_DATA.includedFeatures.length).toBeGreaterThanOrEqual(5);

    const fullText = PRICING_DATA.includedFeatures.join(' ').toLowerCase();
    expect(fullText).toContain('mesas');
    expect(fullText).toContain('kds');
    expect(fullText).toContain('pix');
    expect(fullText).toContain('dashboard');
  });

  it('has direct CTA leading to registration', () => {
    expect(PRICING_DATA.cta.label).toBeDefined();
    expect(PRICING_DATA.cta.href).toBe('/signup');
    expect(PRICING_DATA.cta.authHref).toBe('/dashboard');
  });
});
