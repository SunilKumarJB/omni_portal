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
const STEP_THEMES = {
  1: {
    color: '#2EBA53', // Google Green
    bgDone: '#2EBA53',
    textDone: '#ffffff',
  },
  2: {
    color: '#FFC30E', // Google Yellow
    bgDone: '#FFC30E',
    textDone: '#000000',
  },
  3: {
    color: '#EA4335', // Google Red
    bgDone: '#EA4335',
    textDone: '#ffffff',
  },
  4: {
    color: '#2986FF', // Google Blue
    bgDone: '#2986FF',
    textDone: '#ffffff',
  },
  5: {
    isGradient: true,
  },
};

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

        <nav aria-label="Progress" className="my-8 flex flex-1 flex-col justify-center">
          <ol className="space-y-1">
            {steps.map((step, i) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              const last = i === steps.length - 1;
              const theme = STEP_THEMES[step.id];

              return (
                <li key={step.id} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    {theme.isGradient ? (
                      <span
                        className={cn(
                          'relative flex h-11 w-11 shrink-0 rounded-full p-[2px] transition-all duration-300',
                          active && 'scale-105 shadow-md shadow-foreground/5',
                          done && 'scale-105',
                        )}
                        style={{
                          background:
                            active || done
                              ? 'linear-gradient(135deg, #2EBA53, #FFC30E, #EA4335, #2986FF)'
                              : 'var(--border)',
                        }}
                      >
                        <span
                          className={cn(
                            'flex h-full w-full items-center justify-center rounded-full text-base font-bold transition-colors duration-300',
                            active
                              ? 'bg-background text-foreground'
                              : done
                                ? 'bg-gradient-to-br from-[#2EBA53] via-[#EA4335] to-[#2986FF] text-white'
                                : 'bg-background text-muted-foreground',
                          )}
                        >
                          {done ? <Check className="h-5 w-5" strokeWidth={3} /> : step.id}
                        </span>
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all duration-300',
                          active && 'scale-105 shadow-md shadow-foreground/5',
                          done && 'scale-105',
                        )}
                        style={{
                          border: active
                            ? `2px solid ${theme.color}`
                            : done
                              ? 'none'
                              : '1px solid var(--border)',
                          backgroundColor: active
                            ? `${theme.color}14`
                            : done
                              ? theme.bgDone
                              : 'transparent',
                          color: active
                            ? theme.color
                            : done
                              ? theme.textDone
                              : 'var(--muted-foreground)',
                        }}
                      >
                        {done ? <Check className="h-5 w-5" strokeWidth={3} /> : step.id}
                      </span>
                    )}
                    {!last && (
                      <span
                        className="my-2 w-0.5 flex-1 transition-colors duration-300"
                        style={{
                          minHeight: 36,
                          backgroundColor: done ? theme.color : 'var(--border)',
                        }}
                      />
                    )}
                  </div>
                  <div className={cn('pt-0.5', last ? 'pb-0' : 'pb-8')}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      Step {step.id}
                    </div>
                    <div
                      className={cn(
                        'text-lg font-bold tracking-tight transition-colors duration-200 mt-0.5',
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

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-6">
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
