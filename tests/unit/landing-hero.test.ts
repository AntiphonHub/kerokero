import { describe, it, expect } from 'vitest';
import {
  HERO_CONTENT,
  MOCK_DASHBOARD_DATA,
  MOCK_MOBILE_ORDER_DATA,
  getHeroCta,
  formatMockCurrency,
} from '@/lib/landing/hero-data';

describe('Landing Hero Data & Helpers', () => {
  it('contains valid hero assets paths and badge', () => {
    expect(HERO_CONTENT.logoWhite).toBe('/images/logo_white.png');
    expect(HERO_CONTENT.backgroundHero).toBe('/images/background_hero.png');
    expect(HERO_CONTENT.badge.domain).toBe('bempedi.com');
    expect(HERO_CONTENT.badge.text).toBe('Autoatendimento & KDS Digital');
  });

  it('has compelling headline and promise without AI slop or emojis', () => {
    expect(HERO_CONTENT.headline).toBeDefined();
    expect(HERO_CONTENT.headline.length).toBeGreaterThan(15);
    expect(HERO_CONTENT.subheadline).toBeDefined();
    expect(HERO_CONTENT.subheadline.length).toBeGreaterThan(30);

    // Ensure zero emojis in landing hero copy
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(HERO_CONTENT.headline)).toBe(false);
    expect(emojiRegex.test(HERO_CONTENT.subheadline)).toBe(false);
    expect(emojiRegex.test(HERO_CONTENT.primaryCta.label)).toBe(false);
    expect(emojiRegex.test(HERO_CONTENT.socialProof.label)).toBe(false);
    expect(HERO_CONTENT.socialProof.count).toBe('+ de 70');
  });

  it('returns correct CTA depending on session presence', () => {
    const guestCta = getHeroCta(false);
    expect(guestCta.label).toBe('Começar Agora');
    expect(guestCta.href).toBe('/cadastro');

    const authCta = getHeroCta(true);
    expect(authCta.label).toBe('Acessar Painel');
    expect(authCta.href).toBe('/dashboard');
  });

  it('has populated and coherent mock metrics for Mac Dashboard', () => {
    expect(MOCK_DASHBOARD_DATA.todayRevenue).toBeGreaterThan(1000);
    expect(MOCK_DASHBOARD_DATA.activeOrders).toBeGreaterThan(0);
    expect(MOCK_DASHBOARD_DATA.averageTicket).toBeGreaterThan(0);
    expect(MOCK_DASHBOARD_DATA.occupiedTables.active).toBeLessThanOrEqual(
      MOCK_DASHBOARD_DATA.occupiedTables.total
    );
    expect(MOCK_DASHBOARD_DATA.hourlyRevenue.length).toBeGreaterThan(5);
    expect(MOCK_DASHBOARD_DATA.recentOrders.length).toBeGreaterThan(0);
  });

  it('has realistic customer mobile order data for iPhone Mockup', () => {
    expect(MOCK_MOBILE_ORDER_DATA.tableNumber).toBe('08');
    expect(MOCK_MOBILE_ORDER_DATA.customerName).toBe('Carlos');
    expect(MOCK_MOBILE_ORDER_DATA.items.length).toBeGreaterThanOrEqual(2);
    expect(MOCK_MOBILE_ORDER_DATA.total).toBeGreaterThan(0);
  });

  it('formats mock currency in Brazilian Real accurately', () => {
    expect(formatMockCurrency(4890.5)).toContain('4.890,50');
    expect(formatMockCurrency(84.2)).toContain('84,20');
  });
});
