import React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ref, ...props }) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground leading-relaxed',
        'placeholder:text-muted-foreground/60 transition-colors',
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
