/**
 * Configuração e padronização do Selo de Conformidade BaaS Asaas
 * De acordo com a Resolução Conjunta nº 16/2025 do Banco Central
 * e o Playbook de BaaS para Clientes Asaas.
 */

export const ASAAS_SEAL_URL =
  'https://baas.asaas.com/selos/Servicos_financeiros_Asaas-Reduzida-Positivo.svg?id=aaa17caf-5100-4b58-bffc-4f1fb50bd390';

export const ASAAS_REDIRECT_URL = 'https://asaas.com';

export const ASAAS_REGULATORY_DISCLAIMER =
  'Serviços financeiros prestados por ASAAS GESTÃO FINANCEIRA INSTITUIÇÃO DE PAGAMENTO S.A., instituição de pagamento autorizada pelo Banco Central do Brasil.';

export type AsaasSealSize = 'default' | 'compact' | 'xs';

export interface AsaasSealDimensions {
  width: number;
  height: number;
}

export function getAsaasSealDimensions(size: AsaasSealSize = 'default'): AsaasSealDimensions {
  switch (size) {
    case 'compact':
      return { width: 120, height: 36 };
    case 'xs':
      return { width: 100, height: 30 };
    case 'default':
    default:
      return { width: 160, height: 48 };
  }
}

export function getAsaasLinkAttributes() {
  return {
    href: ASAAS_REDIRECT_URL,
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}
