import { Check, FlaskConical } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { PortalMark } from '@/components/AppHeader';
import ThemeToggle from '@/components/ThemeToggle';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Fixed-height left rail for the wizard. Holds the brand, tagline, a vertical
 * stepper (the steps are a real sequence, so vertical order encodes progress),
 * and the session controls. Transparent so the page's top brand gradient shows
 * through behind it.
 */
export default function SideRail({ steps, currentStep, testMode, setTestMode }) {
  return (
    <aside className="relative z-10 hidden w-80 shrink-0 flex-col border-r border-border/60 px-8 py-9 lg:flex xl:w-96">
      <div className="flex h-full min-h-0 animate-rise-in flex-col">
        <Link to="/" className="flex items-center gap-3 rounded-full focus-visible:outline-none">
          <PortalMark />
          <span className="text-base font-semibold tracking-tight text-foreground">
            The Omni Portal
          </span>
        </Link>

        <div className="mt-10">
          <p className="font-display text-3xl font-bold leading-[1.04] tracking-tight text-foreground xl:text-[34px]">
            Step inside your imagination
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Type a prompt. Transport yourself anywhere.
          </p>
        </div>

        <nav aria-label="Progress" className="mt-12 flex-1">
          <ol>
            {steps.map((step, i) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              const last = i === steps.length - 1;
              return (
                <li key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300',
                        done && 'bg-success text-success-foreground',
                        active && 'border-2 border-foreground bg-foreground/5 text-foreground',
                        !done && !active && 'border border-border text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.id}
                    </span>
                    {!last && (
                      <span
                        className={cn(
                          'my-1.5 w-px flex-1 transition-colors duration-300',
                          done ? 'bg-foreground/30' : 'bg-border',
                        )}
                        style={{ minHeight: 26 }}
                      />
                    )}
                  </div>
                  <div className={cn('pt-1.5', last ? 'pb-0' : 'pb-6')}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                      Step {step.id}
                    </div>
                    <div
                      className={cn(
                        'text-[15px] font-medium leading-tight transition-colors',
                        active
                          ? 'text-foreground'
                          : done
                            ? 'text-foreground/70'
                            : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-6">
          <div className="flex select-none items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Test mode</span>
            <Switch
              checked={testMode}
              onCheckedChange={setTestMode}
              aria-label="Toggle test mode"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
