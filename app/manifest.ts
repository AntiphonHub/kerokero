import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bempedi - Comanda Digital',
    short_name: 'Bempedi',
    description: 'Comanda digital inteligente na mesa para bares e restaurantes',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#121212',
    icons: [
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

