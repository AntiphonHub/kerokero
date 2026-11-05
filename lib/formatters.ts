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

/**
 * Formata datas garantindo o fuso horário oficial de Brasília (America/Sao_Paulo).
 * Trata tanto strings de apenas data 'YYYY-MM-DD' (evitando o recuo de UTC midnight)
 * quanto timestamps completos ISO/SQL.
 */
export function formatBrasiliaDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const trimmed = dateStr.trim();

  // Data pura (ex: "2026-11-04") sem hora: evita converter para UTC midnight que volta 1 dia
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}/${month}/${year}`;
  }

  try {
    const date = new Date(trimmed);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return trimmed;
  }
}
