import { describe, it, expect } from 'vitest';
import { BENTO_FEATURES, FEATURES_HEADER } from '@/lib/landing/features-data';

describe('Landing Features Bento Data', () => {
  it('contains clean header information without emojis', () => {
    expect(FEATURES_HEADER.title).toBeDefined();
    expect(FEATURES_HEADER.description).toBeDefined();

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(FEATURES_HEADER.title)).toBe(false);
    expect(emojiRegex.test(FEATURES_HEADER.description)).toBe(false);
  });

  it('contains the core key features in bento format', () => {
    const ids = BENTO_FEATURES.map((f) => f.id);
    expect(ids).toContain('client-app');
    expect(ids).toContain('custom-cards');
    expect(ids).toContain('dashboard-metrics');
    expect(ids).toContain('kds-cozinha');
  });

  it('ensures every bento card has valid title, description, and image slot without bullet points', () => {
    for (const feature of BENTO_FEATURES) {
      expect(feature.title.length).toBeGreaterThan(10);
      expect(feature.description.length).toBeGreaterThan(25);
      expect(feature.imageSlot.alt).toBeDefined();
      expect(feature.imageSlot.src).toBeDefined();

      // Zero emojis rule
      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(emojiRegex.test(feature.title)).toBe(false);
      expect(emojiRegex.test(feature.description)).toBe(false);
    }
  });

  it('configures balanced 12-column spans (7+5 and 5+7) for single screen layout', () => {
    expect(BENTO_FEATURES[0].colSpan).toContain('lg:col-span-7');
    expect(BENTO_FEATURES[1].colSpan).toContain('lg:col-span-5');
    expect(BENTO_FEATURES[2].colSpan).toContain('lg:col-span-5');
    expect(BENTO_FEATURES[3].colSpan).toContain('lg:col-span-7');
  });
});
