export interface BentoFeature {
  id: string;
  badge: string;
  title: string;
  description: string;
  colSpan: string;
  imageSlot: {
    src: string;
    alt: string;
    placeholderLabel?: string;
  };
}

export const FEATURES_HEADER = {
  title: 'Tudo o que seu salão precisa para operar no piloto automático',
  description:
    'Do pedido feito pelo cliente na mesa ao fechamento instantâneo via PIX, cada ferramenta foi desenhada para acelerar o atendimento e eliminar gargalos.',
};

export const BENTO_FEATURES: BentoFeature[] = [
  {
    id: 'client-app',
    badge: 'Experiência do Consumidor',
    title: 'App Completo no Celular do Cliente (Zero Fricção)',
    description:
      'O cliente lê o QR Code na mesa e faz seus próprios pedidos em segundos. Sem esperar o garçom, sem instalar app e com fotos reais do cardápio.',
    colSpan: 'col-span-12 lg:col-span-7',
    imageSlot: {
      src: '/images/features/feature-client-app.png',
      alt: 'Interface do app mobile da mesa',
      placeholderLabel: 'Mockup App do Cliente',
    },
  },
  {
    id: 'custom-cards',
    badge: 'Operação de Salão',
    title: 'Customização de Cartões de Mesa & QR Code',
    description:
      'Gere e personalize cartões de mesa físicos com a identidade da sua marca, com QR codes dinâmicos protegidos por tokens criptográficos seguros.',
    colSpan: 'col-span-12 lg:col-span-5',
    imageSlot: {
      src: '/images/features/feature-custom-cards.png',
      alt: 'Cartão de mesa com QR Code estilizado',
      placeholderLabel: 'Cartão da Mesa com QR Code',
    },
  },
  {
    id: 'kds-cozinha',
    badge: 'Cozinha & Bar',
    title: 'KDS Cozinha 100% Digital',
    description:
      'Fila de pedidos em tempo real em monitores ou tablets. Elimine bobinas térmicas caras e acabe de vez com comandas perdidas no horário de pico.',
    colSpan: 'col-span-12 lg:col-span-5',
    imageSlot: {
      src: '/images/features/feature-kds.png',
      alt: 'Painel KDS de cozinha',
      placeholderLabel: 'Monitor de Pedidos KDS',
    },
  },
  {
    id: 'dashboard-metrics',
    badge: 'Inteligência de Vendas',
    title: 'Dashboard com Métricas em Tempo Real',
    description:
      'Acompanhe o faturamento por hora, ticket médio, ocupação das mesas e ranking de itens mais vendidos sincronizados instantaneamente.',
    colSpan: 'col-span-12 lg:col-span-7',
    imageSlot: {
      src: '/images/features/feature-dashboard.png',
      alt: 'Painel de métricas analíticas e faturamento',
      placeholderLabel: 'Dashboard com Gráficos',
    },
  },
];
