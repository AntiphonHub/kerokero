/**
 * Validação algorítmica matemática de CNPJ (Módulo 11 com pesos)
 */
export function isValidCnpj(value: string): boolean {
  if (!value) return false;

  // Remove caracteres não numéricos
  const clean = value.replace(/\D/g, '');

  // CNPJ deve ter exatamente 14 dígitos
  if (clean.length !== 14) return false;

  // Rejeita sequências de dígitos todos iguais (ex: 00000000000000, 11111111111111)
  if (/^(\d)\1+$/.test(clean)) return false;

  // Cálculo do primeiro dígito verificador
  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  // Cálculo do segundo dígito verificador
  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(1))) return false;

  return true;
}
