export interface HeroCtaLink {
  label: string;
  href: string;
}

export interface MockOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export const HERO_CONTENT = {
  logoWhite: '/images/logo_white.png',
  backgroundHero: '/images/background_hero.png',
  badge: {
    domain: 'bempedi.com',
    text: 'Autoatendimento & KDS Digital',
  },
  headline: 'A comanda digital que acelera seu salão e multiplica o faturamento',
  subheadline:
    'Seus clientes pedem e pagam via QR Code na mesa em segundos. Pedidos direto na cozinha, sem filas para pagar e com controle total em tempo real no seu painel.',
  primaryCta: {
    label: 'Começar Agora',
    href: '/signup',
    authLabel: 'Acessar Painel',
    authHref: '/dashboard',
  },
  secondaryCta: {
    label: 'Ver Demonstração',
    href: '#demonstracao',
  },
  highlights: [
    'Sem maquininha travando o salão',
    'PIX dinâmico com conciliação na hora',
    'KDS integrado direto com a cozinha',
  ],
} as const;

export function getHeroCta(hasSession: boolean): HeroCtaLink {
  if (hasSession) {
    return {
      label: HERO_CONTENT.primaryCta.authLabel,
      href: HERO_CONTENT.primaryCta.authHref,
    };
  }

  return {
    label: HERO_CONTENT.primaryCta.label,
    href: HERO_CONTENT.primaryCta.href,
  };
}

export function formatMockCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const MOCK_DASHBOARD_DATA = {
  establishmentName: 'Bempedi Burger & Tap',
  todayRevenue: 4890.5,
  revenueGrowth: '+18.4%',
  activeOrders: 18,
  averageTicket: 84.2,
  ticketGrowth: '+12.1%',
  occupiedTables: {
    active: 14,
    total: 20,
    occupancyRate: '70%',
  },
  hourlyRevenue: [
    { hour: '11h', value: 320 },
    { hour: '12h', value: 890 },
    { hour: '13h', value: 1240 },
    { hour: '14h', value: 650 },
    { hour: '17h', value: 410 },
    { hour: '18h', value: 780 },
    { hour: '19h', value: 1450 },
    { hour: '20h', value: 1890 },
    { hour: '21h', value: 1620 },
    { hour: '22h', value: 980 },
  ],
  recentOrders: [
    {
      id: 'ord-104',
      table: 'Mesa 08',
      itemsCount: 3,
      total: 88.0,
      status: 'Em preparo',
      time: 'Há 2 min',
    },
    {
      id: 'ord-103',
      table: 'Mesa 04',
      itemsCount: 2,
      total: 64.5,
      status: 'Pronto',
      time: 'Há 5 min',
    },
    {
      id: 'ord-102',
      table: 'Mesa 12',
      itemsCount: 5,
      total: 142.0,
      status: 'Pago via PIX',
      time: 'Há 11 min',
    },
  ],
};

export const MOCK_MOBILE_ORDER_DATA = {
  tableNumber: '08',
  establishmentName: 'Bempedi Burger & Tap',
  customerName: 'Carlos',
  items: [
    {
      id: 'it-1',
      name: 'Smash Bacon Especial',
      description: 'Blend 160g, cheddar inglês, bacon crocante e maionese defumada',
      price: 38.0,
      quantity: 1,
      image: '/images/food-burger.png',
    },
    {
      id: 'it-2',
      name: 'Batata Rústica com Alecrim',
      description: 'Batatas crocantes temperadas com flor de sal e páprica',
      price: 24.0,
      quantity: 1,
      image: '/images/food-marmita.png',
    },
    {
      id: 'it-3',
      name: 'Chopp Artesanal IPA 500ml',
      description: 'Cervejaria local, notas cítricas e refrescantes',
      price: 18.0,
      quantity: 1,
      image: '/images/food-pizza.png',
    },
  ],
  subtotal: 80.0,
  serviceTax: 8.0,
  total: 88.0,
};
