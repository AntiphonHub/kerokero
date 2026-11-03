export function formatCentsToBrl(cents: number | null | undefined): string {
  if (cents == null || isNaN(cents)) return 'R$ 0,00';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export const formatCurrency = formatCentsToBrl;

export function parseBrlToCents(val: string): number {
  const digits = val.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10);
}

export function maskCurrencyInput(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
