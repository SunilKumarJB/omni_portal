import { Check, FlaskConical, Images } from 'lucide-react';
import type * as React from 'react';
import { Link } from 'react-router-dom';
import { PortalMark } from '@/components/AppHeader';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Fixed-height left rail for the wizard. Holds the brand, tagline, a vertical
 * stepper (the steps are a real sequence, so vertical order encodes progress),
 * and the session controls. Transparent so the page's top brand gradient shows
 * through behind it.
 */
interface StepItem {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
}

type StepAccent =
  | { fill: string; text: string; ring?: never; line?: never }
  | { fill: string; text: string; ring: string; line: string };

const STEP_ACCENTS: Record<StepItem['id'], StepAccent> = {
  1: { fill: '#4285F4', text: '#FFFFFF' }, // Blue (Director)
  2: { fill: '#F4B400', text: '#171202' }, // Yellow (Product)
  3: { fill: '#0F9D58', text: '#06130A' }, // Green (Dialogue)
  4: { fill: '#AB47BC', text: '#FFFFFF' }, // Purple (Presenter)
  5: { fill: '#DB4437', text: '#FFFFFF' }, // Red (Scenario)
  6: {
    fill: 'hsl(var(--foreground))',
    ring: 'conic-gradient(from -35deg, #4285F4 0deg 90deg, #DB4437 90deg 180deg, #F4B400 180deg 270deg, #0F9D58 270deg 360deg)',
    line: 'linear-gradient(180deg, #4285F4 0%, #DB4437 33%, #F4B400 66%, #0F9D58 100%)',
    text: 'hsl(var(--background))',
  },
};

interface SideRailProps {
  steps: StepItem[];
  currentStep: number;
  testMode: boolean;
  setTestMode: React.Dispatch<React.SetStateAction<boolean>>;
  onBrandClick: () => void;
  /** Highest step the rail may jump to. Steps beyond it stay inert. */
  maxNavigableStep?: number;
  onStepSelect?: (step: StepItem['id']) => void;
}

export default function SideRail({
  steps,
  currentStep,
  testMode,
  setTestMode,
  onBrandClick,
  maxNavigableStep = 0,
  onStepSelect,
}: SideRailProps) {
  return (
    <aside className="relative z-10 hidden w-72 shrink-0 flex-col border-r border-border/60 px-7 py-5 lg:flex xl:w-80">
      <div className="flex h-full min-h-0 animate-rise-in flex-col">
        <button
          type="button"
          onClick={onBrandClick}
          className="flex items-center gap-3 rounded-full text-left transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Return to the first step"
        >
          <PortalMark />
          <span className="text-base font-semibold tracking-tight text-foreground">
            The Omni Portal
          </span>
        </button>

        <div className="mt-5">
          <p className="font-display text-2xl font-bold leading-[1.04] tracking-tight text-foreground xl:text-[28px]">
            Step inside your imagination
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground xl:text-sm">
            A cinematic Omni demo deck for live executive showcases.
          </p>
        </div>

        <nav aria-label="Progress" className="my-4 flex flex-1 flex-col justify-center">
          <ol className="space-y-0.5">
            {steps.map((step, i) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              const last = i === steps.length - 1;
              const nextIsFinal = steps[i + 1]?.id === 6;
              const accent = STEP_ACCENTS[step.id];
              const filled = active || done;
              const segmented = step.id === 6;
              const navigable = !!onStepSelect && !active && step.id <= maxNavigableStep;

              const label = (
                <>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                    Step {step.id}
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 text-sm font-bold tracking-tight transition-colors duration-200 xl:text-base',
                      active
                        ? 'text-foreground'
                        : done
                          ? 'text-foreground/70'
                          : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </div>
                </>
              );

              return (
                <li key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300',
                        active && !segmented && 'scale-105 shadow-lg shadow-black/20',
                        active && segmented && 'scale-105',
                        !filled && 'bg-background',
                        segmented && 'p-[3px]',
                      )}
                      style={{
                        background: segmented
                          ? accent.ring
                          : filled
                            ? accent.fill
                            : `${accent.fill}22`,
                        borderColor: segmented || filled ? 'transparent' : `${accent.fill}80`,
                        color: segmented ? accent.text : filled ? accent.text : accent.fill,
                        opacity: segmented && !filled ? 0.48 : 1,
                      }}
                    >
                      <span
                        className={cn(
                          segmented &&
                            'flex h-full w-full items-center justify-center rounded-full bg-foreground text-background',
                          segmented && !filled && 'bg-background text-muted-foreground',
                        )}
                      >
                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
                      </span>
                    </span>
                    {!last && (
                      <span
                        className={cn(
                          'my-2 w-0.5 flex-1 transition-colors duration-300',
                          nextIsFinal && currentStep >= 6 && 'opacity-0',
                        )}
                        style={{
                          minHeight: 24,
                          background: done ? (accent.line ?? accent.fill) : 'var(--border)',
                        }}
                      />
                    )}
                  </div>
                  {navigable ? (
                    <button
                      type="button"
                      onClick={() => onStepSelect?.(step.id)}
                      className={cn(
                        'rounded-md pt-0 text-left transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        last ? 'pb-0' : 'pb-4',
                      )}
                    >
                      {label}
                    </button>
                  ) : (
                    <div className={cn('pt-0', last ? 'pb-0' : 'pb-4')}>{label}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex select-none items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Test mode</span>
            <Switch
              checked={testMode}
              onCheckedChange={setTestMode}
              aria-label="Toggle test mode"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Open gallery"
              asChild
              className="h-9 w-9 rounded-full"
            >
              <Link to="/gallery">
                <Images className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
