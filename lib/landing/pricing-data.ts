export interface PricingCta {
  label: string;
  href: string;
  authLabel: string;
  authHref: string;
}

export const PRICING_DATA = {
  title: 'Preço simples, direto e sem surpresas',
  description:
    'Sem planos confusos, sem taxa de adesão e sem pegadinhas. Uma mensalidade única que dá acesso irrestrito a todas as funcionalidades do Bempedi.',
  amount: 149,
  currency: 'R$',
  period: '/ mês',
  billingNote: 'Pagou, usou. Sem taxa de cancelamento e sem fidelidade.',
  includedFeatures: [
    'Mesas e comandas simultâneas ilimitadas',
    'App do cliente na mesa via QR Code (Zero Fricção)',
    'KDS Cozinha 100% digital em tempo real',
    'Dashboard analítico com métricas e faturamento ao vivo',
    'PIX dinâmico integrado com conciliação instantânea',
    'Impressão de cartões de mesa e QR Codes com a sua marca',
    'Suporte técnico e atualizações contínuas inclusas',
  ],
  cta: {
    label: 'Começar Agora',
    href: '/signup',
    authLabel: 'Acessar Painel',
    authHref: '/dashboard',
  },
} as const;

export function formatPricingValue(amount: number): string {
  return `R$ ${amount.toFixed(0)}`;
}
