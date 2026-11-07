import { describe, it, expect } from 'vitest';
import {
  SITE_URL,
  SEO_METADATA,
  ROBOTS_RULES,
  getSitemapEntries,
  generateSoftwareStructuredData,
} from '@/lib/seo/config';

describe('SEO Configuration & Technical Indexing', () => {
  it('defines the official canonical production site URL', () => {
    expect(SITE_URL).toBe('https://bempedi.com');
  });

  it('configures rich search metadata without emojis', () => {
    expect(SEO_METADATA.title.default).toContain('Bempedi');
    expect(SEO_METADATA.title.template).toContain('%s | Bempedi');
    expect(SEO_METADATA.description.length).toBeGreaterThan(50);

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(SEO_METADATA.title.default)).toBe(false);
    expect(emojiRegex.test(SEO_METADATA.description)).toBe(false);

    expect(SEO_METADATA.keywords).toContain('comanda digital');
    expect(SEO_METADATA.keywords).toContain('restaurante');
    expect(SEO_METADATA.keywords).toContain('cardápio digital');
  });

  it('configures Open Graph and Twitter card specifications', () => {
    expect(SEO_METADATA.openGraph.siteName).toBe('Bempedi');
    expect(SEO_METADATA.openGraph.type).toBe('website');
    expect(SEO_METADATA.openGraph.locale).toBe('pt_BR');
    expect(SEO_METADATA.twitter.card).toBe('summary_large_image');
  });

  it('restricts private and client-table routes in robots rules', () => {
    expect(ROBOTS_RULES.rules.allow).toContain('/');
    expect(ROBOTS_RULES.rules.allow).toContain('/login');
    expect(ROBOTS_RULES.rules.allow).toContain('/cadastro');

    expect(ROBOTS_RULES.rules.disallow).toContain('/dashboard/');
    expect(ROBOTS_RULES.rules.disallow).toContain('/m/');
    expect(ROBOTS_RULES.rules.disallow).toContain('/api/');
    expect(ROBOTS_RULES.rules.disallow).toContain('/kds/');
    expect(ROBOTS_RULES.rules.disallow).toContain('/onboarding/');

    expect(ROBOTS_RULES.sitemap).toBe('https://bempedi.com/sitemap.xml');
  });

  it('generates complete sitemap entries for public routes', () => {
    const entries = getSitemapEntries();
    expect(entries.length).toBeGreaterThanOrEqual(3);

    const home = entries.find((e) => e.url === 'https://bempedi.com');
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1.0);
    expect(home?.changeFrequency).toBe('weekly');

    const cadastro = entries.find((e) => e.url === 'https://bempedi.com/cadastro');
    expect(cadastro).toBeDefined();
    expect(cadastro?.priority).toBe(0.8);
  });

  it('generates valid Schema.org SoftwareApplication JSON-LD', () => {
    const jsonLd = generateSoftwareStructuredData();
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.name).toBe('Bempedi');
    expect(jsonLd.applicationCategory).toBe('BusinessApplication');
    expect(jsonLd.offers.price).toBe('149.00');
    expect(jsonLd.offers.priceCurrency).toBe('BRL');
  });
});
