import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared step header (eyebrow + title + subtitle) used by every wizard step.
 */
interface StepHeadingProps {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export default function StepHeading({ eyebrow, title, children, className }: StepHeadingProps) {
  return (
    <div className={cn('mb-9 xl:mb-11', className)}>
      {eyebrow && (
        <span className="mb-2.5 block text-[11px] xl:text-xs font-bold uppercase tracking-[0.2em] xl:tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2
        tabIndex={-1}
        className="mb-2 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-4xl xl:text-[40px] 2xl:text-[46px]"
      >
        {title}
      </h2>
      {children && (
        <p className="max-w-2xl xl:max-w-4xl text-[15px] leading-relaxed text-muted-foreground lg:text-base xl:text-[17px] 2xl:text-[18px]">
          {children}
        </p>
      )}
    </div>
  );
}

/** Small uppercase label used inside cards. */
export function FieldLabel({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'mb-2 block text-[10px] xl:text-[11px] 2xl:text-[12px] font-bold uppercase tracking-[0.14em] xl:tracking-[0.16em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
