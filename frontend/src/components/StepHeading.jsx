import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared step header (eyebrow + title + subtitle) used by every wizard step.
 */
export default function StepHeading({ eyebrow, title, children, className }) {
  return (
    <div className={cn('mb-9', className)}>
      {eyebrow && (
        <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="mb-2 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-4xl">
        {title}
      </h2>
      {children && (
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground lg:text-base">
          {children}
        </p>
      )}
    </div>
  );
}

/** Small uppercase label used inside cards. */
export function FieldLabel({ className, ...props }) {
  return (
    <span
      className={cn(
        'mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
