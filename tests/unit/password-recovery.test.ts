import { describe, it, expect } from 'vitest';
import { AppwriteException } from 'appwrite';
import {
  recoveryCodeSchema,
  recoveryEmailSchema,
  recoveryResetSchema,
} from '@/lib/schemas/auth';
import {
  sanitizeOtpDigits,
  applyOtpPaste,
  applyOtpDigitChange,
  applyOtpBackspace,
  normalizeRecoveryError,
  RECOVERY_REQUEST_SUCCESS_MESSAGE,
  RECOVERY_INVALID_CODE_MESSAGE,
} from '@/lib/auth/recovery';
import { evaluateUserAccess } from '@/lib/auth/access-gate';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';
import {
  RECOVERY_OTP_EMAIL_HTML,
  RECOVERY_OTP_EMAIL_SUBJECT,
} from '@/lib/email/recovery-otp-template';

describe('Password Recovery (OTP) - Schemas', () => {
  describe('recoveryEmailSchema', () => {
    it('validates and trims a valid email', () => {
      const res = recoveryEmailSchema.safeParse({ email: '  lojista@bempedi.com  ' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('lojista@bempedi.com');
      }
    });

    it('rejects empty or invalid email', () => {
      expect(recoveryEmailSchema.safeParse({ email: '' }).success).toBe(false);
      expect(recoveryEmailSchema.safeParse({ email: 'nao-e-email' }).success).toBe(false);
    });
  });

  describe('recoveryCodeSchema', () => {
    it('accepts 6 numeric digits and rejects incomplete or non-numeric codes', () => {
      expect(recoveryCodeSchema.safeParse({ code: '123456' }).success).toBe(true);
      expect(recoveryCodeSchema.safeParse({ code: '12345' }).success).toBe(false);
      expect(recoveryCodeSchema.safeParse({ code: '12ab56' }).success).toBe(false);
    });
  });

  describe('recoveryResetSchema', () => {
    it('validates a 6-digit code and matching passwords', () => {
      const res = recoveryResetSchema.safeParse({
        code: '123456',
        password: 'NovaSenhaSegura!2026',
        passwordConfirm: 'NovaSenhaSegura!2026',
      });
      expect(res.success).toBe(true);
    });

    it('rejects codes that are not exactly 6 digits', () => {
      expect(
        recoveryResetSchema.safeParse({
          code: '12345',
          password: 'NovaSenhaSegura!2026',
          passwordConfirm: 'NovaSenhaSegura!2026',
        }).success,
      ).toBe(false);

      expect(
        recoveryResetSchema.safeParse({
          code: '12ab56',
          password: 'NovaSenhaSegura!2026',
          passwordConfirm: 'NovaSenhaSegura!2026',
        }).success,
      ).toBe(false);

      expect(
        recoveryResetSchema.safeParse({
          code: '1234567',
          password: 'NovaSenhaSegura!2026',
          passwordConfirm: 'NovaSenhaSegura!2026',
        }).success,
      ).toBe(false);
    });

    it('rejects short or mismatched passwords', () => {
      const shortRes = recoveryResetSchema.safeParse({
        code: '123456',
        password: '123',
        passwordConfirm: '123',
      });
      expect(shortRes.success).toBe(false);

      const mismatchRes = recoveryResetSchema.safeParse({
        code: '123456',
        password: 'NovaSenhaSegura!2026',
        passwordConfirm: 'OutraSenha!2026',
      });
      expect(mismatchRes.success).toBe(false);
      if (!mismatchRes.success) {
        expect(mismatchRes.error.flatten().fieldErrors.passwordConfirm).toBeDefined();
      }
    });
  });
});

describe('Password Recovery (OTP) - 6-Digit Input Helpers', () => {
  it('sanitizes OTP input keeping at most 6 digits', () => {
    expect(sanitizeOtpDigits('123456')).toBe('123456');
    expect(sanitizeOtpDigits('123-456')).toBe('123456');
    expect(sanitizeOtpDigits('Código: 98 76 54 extra 00')).toBe('987654');
    expect(sanitizeOtpDigits('abc')).toBe('');
  });

  it('pastes full 6-digit code across all boxes regardless of starting slot', () => {
    const empty = ['', '', '', '', '', ''];
    const fromFirst = applyOtpPaste(empty, '482910', 0);
    expect(fromFirst.digits).toEqual(['4', '8', '2', '9', '1', '0']);
    expect(fromFirst.nextFocusIndex).toBe(5);

    const partialExisting = ['1', '2', '', '', '', ''];
    const fromMiddle = applyOtpPaste(partialExisting, '987-654', 3);
    expect(fromMiddle.digits).toEqual(['9', '8', '7', '6', '5', '4']);
    expect(fromMiddle.nextFocusIndex).toBe(5);
  });

  it('pastes shorter snippet starting at current index', () => {
    const current = ['1', '', '', '', '', ''];
    const res = applyOtpPaste(current, '234', 1);
    expect(res.digits).toEqual(['1', '2', '3', '4', '', '']);
    expect(res.nextFocusIndex).toBe(4);
  });

  it('ignores non-numeric paste without altering current digits', () => {
    const current = ['1', '2', '', '', '', ''];
    const res = applyOtpPaste(current, 'hello world', 2);
    expect(res.digits).toEqual(['1', '2', '', '', '', '']);
    expect(res.nextFocusIndex).toBe(2);
  });

  it('advances focus to next box when typing single digit and supports autofill multi-digit change', () => {
    const start = ['', '', '', '', '', ''];
    const step1 = applyOtpDigitChange(start, '7', 0);
    expect(step1.digits).toEqual(['7', '', '', '', '', '']);
    expect(step1.nextFocusIndex).toBe(1);

    const stepLast = applyOtpDigitChange(['7', '1', '2', '3', '4', ''], '9', 5);
    expect(stepLast.digits).toEqual(['7', '1', '2', '3', '4', '9']);
    expect(stepLast.nextFocusIndex).toBe(5);

    const autofill = applyOtpDigitChange(start, '654321', 0);
    expect(autofill.digits).toEqual(['6', '5', '4', '3', '2', '1']);
    expect(autofill.nextFocusIndex).toBe(5);
  });

  it('handles backspace on filled and empty boxes intuitively', () => {
    const filled = ['1', '2', '3', '', '', ''];
    const clearCurrent = applyOtpBackspace(filled, 2);
    expect(clearCurrent.digits).toEqual(['1', '2', '', '', '', '']);
    expect(clearCurrent.nextFocusIndex).toBe(2);

    const moveBack = applyOtpBackspace(['1', '2', '', '', '', ''], 2);
    expect(moveBack.digits).toEqual(['1', '', '', '', '', '']);
    expect(moveBack.nextFocusIndex).toBe(1);

    const atZeroEmpty = applyOtpBackspace(['', '', '', '', '', ''], 0);
    expect(atZeroEmpty.digits).toEqual(['', '', '', '', '', '']);
    expect(atZeroEmpty.nextFocusIndex).toBe(0);
  });
});

describe('Password Recovery (OTP) - Security & Error Mapping', () => {
  it('uses an enumeration-safe message when requesting recovery code', () => {
    expect(RECOVERY_REQUEST_SUCCESS_MESSAGE).toContain('Se existir uma conta');
  });

  it('returns identical invalid code message for both user_invalid_token and user_not_found', () => {
    const invalidTokenErr = new AppwriteException('Invalid token', 401, 'user_invalid_token');
    const userNotFoundErr = new AppwriteException('User not found', 404, 'user_not_found');

    const res1 = normalizeRecoveryError(invalidTokenErr);
    const res2 = normalizeRecoveryError(userNotFoundErr);

    expect(res1.kind).toBe('invalid_code');
    expect(res2.kind).toBe('invalid_code');
    expect(res1.field).toBe('code');
    expect(res2.field).toBe('code');
    expect(res1.message).toBe(RECOVERY_INVALID_CODE_MESSAGE);
    expect(res2.message).toBe(RECOVERY_INVALID_CODE_MESSAGE);
  });

  it('identifies password policy rejections without invalidating the OTP code step', () => {
    const breachedErr = new AppwriteException(
      'Password found in a known data breach.',
      400,
      'general_argument_invalid',
    );
    const historyErr = new AppwriteException(
      'Password recently used.',
      400,
      'password_recently_used',
    );
    const personalErr = new AppwriteException(
      'Password cannot contain personal data.',
      400,
      'password_personal_data',
    );

    for (const err of [breachedErr, historyErr, personalErr]) {
      const normalized = normalizeRecoveryError(err);
      expect(normalized.kind).toBe('password_policy');
      expect(normalized.field).toBe('password');
      expect(normalized.message).toContain('mesmo código');
    }
  });

  it('handles rate limit and generic errors cleanly', () => {
    const rateErr = new AppwriteException('Rate limit exceeded', 429, 'general_rate_limit_exceeded');
    expect(normalizeRecoveryError(rateErr).kind).toBe('rate_limit');

    const genericErr = new Error('Network failure');
    expect(normalizeRecoveryError(genericErr).kind).toBe('generic');
  });
});

describe('Password Recovery (OTP) - Route Access Gate', () => {
  it('allows unauthenticated users on /esqueci-senha', () => {
    const decision = evaluateUserAccess({
      isAuthenticated: false,
      establishment: null,
      pathname: '/esqueci-senha',
    });
    expect(decision.allowed).toBe(true);
    expect(decision.redirectTo).toBeNull();
  });

  it('redirects authenticated users away from /esqueci-senha to dashboard when active', () => {
    const estActive = {
      $id: 'est_1',
      onboardingStep: 4,
      onboardingCompleted: true,
      subscriptionStatus: 'active',
    } as unknown as EstablishmentDocument;

    const decision = evaluateUserAccess({
      isAuthenticated: true,
      establishment: estActive,
      pathname: '/esqueci-senha',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe('/dashboard');
  });
});

describe('Password Recovery (OTP) - Email HTML Template', () => {
  it('follows Bempedi visual theme without emojis or scripts', () => {
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('<!DOCTYPE html>');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('lang="pt-BR"');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('#121212');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('#F59E0B');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('#FFFFFF');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('#F4F4F5');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('Bempedi');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('15 minutos');
    expect(RECOVERY_OTP_EMAIL_HTML).toContain('{{otp}}');
    expect(RECOVERY_OTP_EMAIL_HTML).not.toContain('<script');

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(RECOVERY_OTP_EMAIL_HTML)).toBe(false);
    expect(emojiRegex.test(RECOVERY_OTP_EMAIL_SUBJECT)).toBe(false);
  });
});
