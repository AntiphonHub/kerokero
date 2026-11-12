import { AppwriteException } from 'appwrite';

export const OTP_LENGTH = 6;

export const RECOVERY_REQUEST_SUCCESS_MESSAGE =
  'Se existir uma conta para este e-mail, enviamos um código de 6 dígitos.';

export const RECOVERY_INVALID_CODE_MESSAGE =
  'Código inválido ou expirado. Verifique o código ou solicite um novo.';

export const RECOVERY_PASSWORD_POLICY_MESSAGE =
  'Escolha outra senha mais segura e que não tenha sido usada recentemente. O mesmo código continua válido.';

export const RECOVERY_RATE_LIMIT_MESSAGE =
  'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.';

export const RECOVERY_GENERIC_ERROR_MESSAGE =
  'Não foi possível concluir a solicitação. Tente novamente em instantes.';

export interface OtpUpdateResult {
  digits: string[];
  nextFocusIndex: number;
}

export type RecoveryErrorKind =
  | 'invalid_code'
  | 'password_policy'
  | 'rate_limit'
  | 'generic';

export interface NormalizedRecoveryError {
  kind: RecoveryErrorKind;
  message: string;
  field?: 'code' | 'password';
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, index));
}

function normalizeDigitsArray(currentDigits: string[], length: number): string[] {
  return Array.from({ length }, (_, idx) => {
    const cleaned = (currentDigits[idx] ?? '').replace(/\D/g, '');
    return cleaned.slice(0, 1);
  });
}

/** Extracts at most `length` numeric digits from any pasted or typed string. */
export function sanitizeOtpDigits(input: string, length = OTP_LENGTH): string {
  return input.replace(/\D/g, '').slice(0, length);
}

/**
 * Distributes pasted or autofilled digits across the OTP slots.
 * A full-length code replaces all slots from index 0 so pasting into any box works.
 */
export function applyOtpPaste(
  currentDigits: string[],
  pastedText: string,
  startIndex: number,
  length = OTP_LENGTH,
): OtpUpdateResult {
  const digits = normalizeDigitsArray(currentDigits, length);
  const safeStart = clampIndex(startIndex, length);
  const cleaned = sanitizeOtpDigits(pastedText, length);

  if (!cleaned) {
    return { digits, nextFocusIndex: safeStart };
  }

  if (cleaned.length >= length) {
    for (let i = 0; i < length; i += 1) {
      digits[i] = cleaned[i] ?? '';
    }
    return { digits, nextFocusIndex: length - 1 };
  }

  for (let i = 0; i < cleaned.length && safeStart + i < length; i += 1) {
    digits[safeStart + i] = cleaned[i];
  }

  return {
    digits,
    nextFocusIndex: Math.min(length - 1, safeStart + cleaned.length),
  };
}

/** Handles single-digit entry, overwrites, clearing, and browser multi-digit autofill. */
export function applyOtpDigitChange(
  currentDigits: string[],
  rawValue: string,
  index: number,
  length = OTP_LENGTH,
): OtpUpdateResult {
  const digits = normalizeDigitsArray(currentDigits, length);
  const safeIndex = clampIndex(index, length);
  const previousDigit = digits[safeIndex];
  const cleaned = rawValue.replace(/\D/g, '');

  if (!cleaned) {
    digits[safeIndex] = rawValue === '' ? '' : previousDigit;
    return { digits, nextFocusIndex: safeIndex };
  }

  if (cleaned.length >= length) {
    return applyOtpPaste(digits, cleaned, 0, length);
  }

  if (cleaned.length === 1) {
    if (cleaned === previousDigit) {
      return { digits, nextFocusIndex: safeIndex };
    }
    digits[safeIndex] = cleaned;
    return {
      digits,
      nextFocusIndex: Math.min(length - 1, safeIndex + 1),
    };
  }

  if (cleaned.length === 2 && previousDigit) {
    const newDigit = cleaned[0] === previousDigit ? cleaned[1] : cleaned[0];
    digits[safeIndex] = newDigit;
    return {
      digits,
      nextFocusIndex: Math.min(length - 1, safeIndex + 1),
    };
  }

  return applyOtpPaste(digits, cleaned, safeIndex, length);
}

/** Clears the current filled slot, or moves back and clears the previous slot when empty. */
export function applyOtpBackspace(
  currentDigits: string[],
  index: number,
  length = OTP_LENGTH,
): OtpUpdateResult {
  const digits = normalizeDigitsArray(currentDigits, length);
  const safeIndex = clampIndex(index, length);

  if (digits[safeIndex]) {
    digits[safeIndex] = '';
    return { digits, nextFocusIndex: safeIndex };
  }

  if (safeIndex > 0) {
    digits[safeIndex - 1] = '';
    return { digits, nextFocusIndex: safeIndex - 1 };
  }

  return { digits, nextFocusIndex: 0 };
}

const PASSWORD_POLICY_TYPES = new Set([
  'password_recently_used',
  'user_password_recently_used',
  'password_personal_data',
]);

const PASSWORD_POLICY_KEYWORDS = [
  'password',
  'senha',
  'breach',
  'dictionary',
  'history',
  'personal',
  'common',
  'weak',
  '8 and 256',
];

function extractErrorMeta(error: unknown): {
  type: string;
  code: number | undefined;
  message: string;
} {
  if (error instanceof AppwriteException) {
    return {
      type: (error.type ?? '').toLowerCase(),
      code: error.code,
      message: (error.message ?? '').toLowerCase(),
    };
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      type: typeof record.type === 'string' ? record.type.toLowerCase() : '',
      code: typeof record.code === 'number' ? record.code : undefined,
      message: typeof record.message === 'string' ? record.message.toLowerCase() : '',
    };
  }

  return { type: '', code: undefined, message: '' };
}

/**
 * Normalizes Appwrite OTP recovery errors while enforcing anti-enumeration
 * and preserving the user's OTP state on password policy rejections.
 */
export function normalizeRecoveryError(error: unknown): NormalizedRecoveryError {
  const { type, code, message } = extractErrorMeta(error);

  if (type === 'general_rate_limit_exceeded' || code === 429) {
    return {
      kind: 'rate_limit',
      message: RECOVERY_RATE_LIMIT_MESSAGE,
    };
  }

  if (
    type === 'user_invalid_token' ||
    type === 'user_not_found' ||
    type === 'user_token_expired'
  ) {
    return {
      kind: 'invalid_code',
      field: 'code',
      message: RECOVERY_INVALID_CODE_MESSAGE,
    };
  }

  const isPasswordPolicyError =
    PASSWORD_POLICY_TYPES.has(type) ||
    ((type === 'general_argument_invalid' || code === 400) &&
      PASSWORD_POLICY_KEYWORDS.some((kw) => message.includes(kw)));

  if (isPasswordPolicyError) {
    return {
      kind: 'password_policy',
      field: 'password',
      message: RECOVERY_PASSWORD_POLICY_MESSAGE,
    };
  }

  return {
    kind: 'generic',
    message: RECOVERY_GENERIC_ERROR_MESSAGE,
  };
}
