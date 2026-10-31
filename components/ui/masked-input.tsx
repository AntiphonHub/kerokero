'use client';

import { forwardRef, useCallback, type ChangeEvent } from 'react';
import { Input, type InputProps } from '@/components/ui/input';

export interface MaskedInputProps extends Omit<InputProps, 'onChange'> {
  mask: (value: string) => string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onMaskedChange?: (masked: string, raw: string) => void;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, onChange, onMaskedChange, ...props }, ref) => {
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const masked = mask(raw);
        e.target.value = masked;

        onChange?.(e);
        onMaskedChange?.(masked, masked.replace(/\D/g, ''));
      },
      [mask, onChange, onMaskedChange],
    );

    return <Input ref={ref} onChange={handleChange} {...props} />;
  },
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
