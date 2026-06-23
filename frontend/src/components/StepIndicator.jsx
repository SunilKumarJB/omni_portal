import { Check } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

const StepIndicator = React.memo(function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        const last = i === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                  done && 'bg-success text-success-foreground',
                  active && 'border-2 border-foreground bg-foreground/5 text-foreground',
                  !done && !active && 'border border-border bg-transparent text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : step.id}
              </div>
              <span
                className={cn(
                  'hidden text-[11px] font-medium tracking-wide transition-colors duration-200 sm:block',
                  active
                    ? 'text-foreground'
                    : done
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60',
                )}
              >
                {step.label}
              </span>
            </div>

            {!last && (
              <div
                className={cn(
                  'mx-3 mb-5 h-px flex-1 transition-colors duration-300 sm:mb-0',
                  done ? 'bg-foreground/40' : 'bg-border',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

export default StepIndicator;
