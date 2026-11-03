import { formatCentsToBrl } from '@/lib/formatters';

/**
 * Formata um valor em centavos para moeda brasileira (BRL).
 */
export function formatPriceCents(cents: number | null | undefined): string {
  return formatCentsToBrl(cents);
}

export { formatCentsToBrl };
