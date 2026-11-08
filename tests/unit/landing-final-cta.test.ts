import { describe, it, expect } from 'vitest';
import { FINAL_CTA_DATA, FOOTER_DATA, getFinalCtaAction } from '@/lib/landing/cta-data';

describe('Landing Final CTA & Footer Data', () => {
  it('contains compelling final closing copy without emojis', () => {
    expect(FINAL_CTA_DATA.headline).toBeDefined();
    expect(FINAL_CTA_DATA.headline.length).toBeGreaterThan(15);
    expect(FINAL_CTA_DATA.subheadline).toBeDefined();
    expect(FINAL_CTA_DATA.subheadline.length).toBeGreaterThan(25);

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(FINAL_CTA_DATA.headline)).toBe(false);
    expect(emojiRegex.test(FINAL_CTA_DATA.subheadline)).toBe(false);
    expect(emojiRegex.test(FINAL_CTA_DATA.primaryButton.label)).toBe(false);
  });

  it('provides correct CTA depending on user authentication status', () => {
    const guestCta = getFinalCtaAction(false);
    expect(guestCta.label).toBe('Criar Conta Agora');
    expect(guestCta.href).toBe('/cadastro');

    const authCta = getFinalCtaAction(true);
    expect(authCta.label).toBe('Acessar Painel');
    expect(authCta.href).toBe('/dashboard');
  });

  it('has trust micro-copy highlights', () => {
    expect(FINAL_CTA_DATA.trustBadges.length).toBeGreaterThanOrEqual(3);
    for (const badge of FINAL_CTA_DATA.trustBadges) {
      expect(badge.length).toBeGreaterThan(5);
    }
  });

  it('configures clean footer navigation links and legal notice', () => {
    expect(FOOTER_DATA.navLinks.length).toBeGreaterThanOrEqual(3);
    expect(FOOTER_DATA.copyright).toContain('Bempedi');
    expect(FOOTER_DATA.cnpj).toBe('49.526.996/0001-62');
    expect(FOOTER_DATA.companyName).toContain('GUILHERME ALVES PROFIRIO');
    expect(FOOTER_DATA.contactEmail).toBe('contato@bempedi.com');
  });
});
