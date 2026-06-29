import type * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ref, ...props }: React.ComponentPropsWithRef<'input'>) {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground/60 transition-colors',
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
