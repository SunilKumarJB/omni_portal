import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared step header (eyebrow + title + subtitle) used by every wizard step.
 */
export default function StepHeading({ eyebrow, title, children, className }) {
  return (
    <div className={cn('mb-8', className)}>
      {eyebrow && (
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="mb-1 font-display text-2xl font-bold leading-tight text-foreground">
        {title}
      </h2>
      {children && <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>}
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
