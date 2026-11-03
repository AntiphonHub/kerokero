import { maskCpf } from '@/lib/masks';

/**
 * Validação algorítmica matemática de CPF (Módulo 11)
 */
export function isValidCpf(value: string): boolean {
  if (!value) return false;

  // Remove caracteres não numéricos
  const clean = value.replace(/\D/g, '');

  // CPF deve ter exatamente 11 dígitos
  if (clean.length !== 11) return false;

  // Rejeita sequências de dígitos todos iguais (ex: 11111111111, 00000000000)
  if (/^(\d)\1+$/.test(clean)) return false;

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(clean.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== Number(clean.charAt(9))) return false;

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(clean.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== Number(clean.charAt(10))) return false;

  return true;
}

/**
 * Formata string como CPF (000.000.000-00)
 */
export function formatCpf(value: string): string {
  return maskCpf(value);
}
