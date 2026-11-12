'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  OTP_LENGTH,
  applyOtpBackspace,
  applyOtpDigitChange,
  applyOtpPaste,
} from '@/lib/auth/recovery';

interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  rightElement?: React.ReactNode;
}

export function OtpInput({
  value,
  onChange,
  label = 'Código de verificação',
  error,
  disabled = false,
  autoFocus = false,
  rightElement,
}: OtpInputProps) {
  const groupId = React.useId();
  const labelId = `${groupId}-label`;
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const digits = React.useMemo(
    () => Array.from({ length: OTP_LENGTH }, (_, idx) => value[idx] ?? ''),
    [value],
  );

  const focusBox = (index: number) => {
    const target = inputRefs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const handleChange = (index: number, rawValue: string) => {
    const result = applyOtpDigitChange(digits, rawValue, index, OTP_LENGTH);
    onChange(result.digits);
    if (result.nextFocusIndex !== index) {
      focusBox(result.nextFocusIndex);
    }
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    const result = applyOtpPaste(digits, pastedText, index, OTP_LENGTH);
    onChange(result.digits);
    focusBox(result.nextFocusIndex);
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const result = applyOtpBackspace(digits, index, OTP_LENGTH);
      onChange(result.digits);
      focusBox(result.nextFocusIndex);
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      const next = [...digits];
      next[index] = '';
      onChange(next);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(Math.max(0, index - 1));
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(Math.min(OTP_LENGTH - 1, index + 1));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusBox(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusBox(OTP_LENGTH - 1);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {(label || rightElement) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <span
              id={labelId}
              className="text-[13px] font-semibold text-zinc-900"
            >
              {label}
            </span>
          ) : (
            <span />
          )}
          {rightElement}
        </div>
      )}

      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className="grid grid-cols-6 gap-2 sm:gap-2.5"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoFocus={autoFocus && index === 0}
            maxLength={OTP_LENGTH}
            disabled={disabled}
            value={digit}
            aria-label={`Dígito ${index + 1} de ${OTP_LENGTH}`}
            aria-invalid={Boolean(error)}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => handleChange(index, event.target.value)}
            onPaste={(event) => handlePaste(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className={cn(
              'h-12 w-full rounded-xl border-[1.5px] bg-white text-center font-mono text-[20px] font-bold text-zinc-900 transition-all outline-none',
              'placeholder:text-zinc-300',
              'focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.18)]',
              'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400',
              digit ? 'border-zinc-300' : 'border-zinc-200',
              error &&
                'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]',
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="text-xs text-red-600 pl-1" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
