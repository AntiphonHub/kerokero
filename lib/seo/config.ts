import type { MetadataRoute } from 'next';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bempedi.com').replace(/\/$/, '');

export const SEO_METADATA = {
  title: {
    default: 'Bempedi | Comanda Digital Inteligente na Mesa',
    template: '%s | Bempedi',
  },
  description:
    'A comanda digital que acelera seu salão e multiplica o faturamento. Seus clientes pedem e pagam via QR Code na mesa em segundos, com pedidos direto na cozinha.',
  keywords: [
    'comanda digital',
    'cardápio digital',
    'restaurante',
    'bar',
    'autoatendimento qr code',
    'kds cozinha',
    'gestão de salão',
    'bempedi',
    'pedidos na mesa',
    'pix na mesa',
  ],
  authors: [{ name: 'Bempedi', url: SITE_URL }],
  creator: 'Bempedi',
  publisher: 'Bempedi',
  openGraph: {
    type: 'website' as const,
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'Bempedi',
    title: 'Bempedi | Comanda Digital Inteligente na Mesa',
    description:
      'A comanda digital que acelera seu salão e multiplica o faturamento. Seus clientes pedem e pagam via QR Code na mesa em segundos.',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Bempedi - Comanda Digital Inteligente na Mesa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Bempedi | Comanda Digital Inteligente na Mesa',
    description:
      'A comanda digital que acelera seu salão e multiplica o faturamento. Seus clientes pedem e pagam via QR Code na mesa em segundos.',
    creator: '@bempedi',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export const ROBOTS_RULES = {
  rules: {
    userAgent: '*',
    allow: ['/', '/login', '/cadastro', '/signup'],
    disallow: [
      '/dashboard/',
      '/kds/',
      '/menu/',
      '/orders/',
      '/tables/',
      '/analytics/',
      '/wallet/',
      '/settings/',
      '/onboarding/',
      '/m/',
      '/api/',
    ],
  },
  sitemap: `${SITE_URL}/sitemap.xml`,
};

export function getSitemapEntries(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/cadastro`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}

export function generateSoftwareStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bempedi',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    url: SITE_URL,
    description:
      'Plataforma SaaS de comanda digital e autoatendimento na mesa para bares e restaurantes.',
    offers: {
      '@type': 'Offer',
      price: '149.00',
      priceCurrency: 'BRL',
      priceValidUntil: '2028-12-31',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Organization',
      name: 'Bempedi',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`,
    },
  };
}
