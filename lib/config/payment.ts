/**
 * Configurações de Pagamento e Feature Flags do Bempedi
 *
 * Enquanto a conta mãe no Asaas estiver em processo de homologação,
 * o pagamento via PIX dinâmico permanece desabilitado por padrão no PWA,
 * mantendo o fechamento exclusivamente via Maquininha de Cartão na mesa.
 *
 * Para reativar o PIX após a homologação:
 * Basta definir NEXT_PUBLIC_ENABLE_PIX_PAYMENT=true no seu arquivo .env
 */

export function isPixPaymentEnabled(): boolean {
  const val = process.env.NEXT_PUBLIC_ENABLE_PIX_PAYMENT?.trim().toLowerCase();
  return val === 'true' || val === '1';
}

export const IS_PIX_PAYMENT_ENABLED = isPixPaymentEnabled();
