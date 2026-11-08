export interface FinalCtaAction {
  label: string;
  href: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FinalCtaConfig {
  headline: string;
  subheadline: string;
  primaryButton: FinalCtaAction;
  secondaryButton: FinalCtaAction;
  trustBadges: string[];
}

export interface FooterConfig {
  brand: string;
  copyright: string;
  cnpj: string;
  companyName: string;
  contactEmail: string;
  navLinks: NavLink[];
}

export const FINAL_CTA_DATA: FinalCtaConfig = {
  headline: 'Pronto para acelerar o salão e multiplicar seu faturamento?',
  subheadline: 'Comece hoje mesmo a transformar o atendimento da sua operação. Ativação em menos de 10 minutos, sem contratos de fidelidade e sem taxa de adesão.',
  primaryButton: {
    label: 'Criar Conta Agora',
    href: '/cadastro',
  },
  secondaryButton: {
    label: 'Entrar na Plataforma',
    href: '/login',
  },
  trustBadges: [
    'Ativação em menos de 10 minutos',
    'Sem fidelidade ou multa rescisória',
    'Suporte direto para seu restaurante',
  ],
};

export const FOOTER_DATA: FooterConfig = {
  brand: 'Bempedi',
  copyright: `© ${new Date().getFullYear()} Bempedi. Todos os direitos reservados.`,
  cnpj: '49.526.996/0001-62',
  companyName: '49.526.996 GUILHERME ALVES PROFIRIO',
  contactEmail: 'contato@bempedi.com',
  navLinks: [
    { label: 'Recursos', href: '#recursos' },
    { label: 'Demonstração', href: '#demonstracao' },
    { label: 'Preço', href: '#preco' },
    { label: 'Entrar', href: '/login' },
    { label: 'Criar Conta', href: '/cadastro' },
  ],
};

export function getFinalCtaAction(hasSession: boolean): FinalCtaAction {
  if (hasSession) {
    return {
      label: 'Acessar Painel',
      href: '/dashboard',
    };
  }

  return {
    label: 'Criar Conta Agora',
    href: '/cadastro',
  };
}
