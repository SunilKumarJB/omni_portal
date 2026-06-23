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
 * and the session controls. The AI-gradient brand moment lives in this rail's
 * top-left corner — the one place it appears in the wizard.
 */
export default function SideRail({ steps, currentStep, testMode, setTestMode }) {
  return (
    <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-background px-7 py-8 lg:flex xl:w-80">
      <div className="ai-gradient-corner" aria-hidden />

      <div className="relative flex h-full min-h-0 flex-col">
        <Link to="/" className="flex items-center gap-3 rounded-full focus-visible:outline-none">
          <PortalMark />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            The Omni Portal
          </span>
        </Link>

        <div className="mt-9">
          <p className="font-display text-[26px] font-bold leading-[1.05] tracking-tight text-foreground">
            Step inside your imagination
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Type a prompt. Transport yourself anywhere.
          </p>
        </div>

        <nav aria-label="Progress" className="mt-10 flex-1">
          <ol>
            {steps.map((step, i) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              const last = i === steps.length - 1;
              return (
                <li key={step.id} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300',
                        done && 'bg-success text-success-foreground',
                        active && 'border-2 border-foreground bg-foreground/5 text-foreground',
                        !done && !active && 'border border-border text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : step.id}
                    </span>
                    {!last && (
                      <span
                        className={cn(
                          'my-1 w-px flex-1 transition-colors duration-300',
                          done ? 'bg-foreground/30' : 'bg-border',
                        )}
                        style={{ minHeight: 22 }}
                      />
                    )}
                  </div>
                  <div className={cn('pt-1', last ? 'pb-0' : 'pb-5')}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                      Step {step.id}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-medium leading-tight transition-colors',
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

        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
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
