'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'group inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'bg-zinc-200 data-[checked]:bg-amber-500',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xs ring-0 transition-transform',
          'data-[checked]:translate-x-5 translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
