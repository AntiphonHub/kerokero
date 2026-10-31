'use client';

import { forwardRef, useId, useState } from 'react';
import { cn } from 'cn';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightElement, showPasswordToggle = true, type, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const effectiveType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="flex flex-col gap-1.5">
        {(label || rightElement) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="text-[13px] font-semibold text-zinc-900"
              >
                {label}
              </label>
            )}
            {rightElement}
          </div>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={cn(
              'h-[46px] w-full rounded-full border-[1.5px] border-zinc-200 bg-white px-5 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] duration-150',
              'placeholder:text-zinc-400',
              'focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.18)]',
              isPassword && showPasswordToggle && 'pr-11',
              error && 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]',
              className,
            )}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-600 pl-1">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
