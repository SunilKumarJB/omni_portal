import type * as React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * Monochrome portal mark. Uses currentColor so it inverts cleanly with the theme.
 */
export function PortalMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-foreground text-background">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </span>
  );
}

/**
 * The four-color accent, used here as the single sanctioned "pop of color" in an
 * otherwise black-and-white shell.
 */
export function GcpBadge() {
  return (
    <span className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 sm:flex">
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden>
        <circle cx="2.5" cy="2.5" r="2.5" fill="#2986FF" />
        <circle cx="7.5" cy="2.5" r="2.5" fill="#EA4335" />
        <circle cx="2.5" cy="7.5" r="2.5" fill="#2EBA53" />
        <circle cx="7.5" cy="7.5" r="2.5" fill="#FFC30E" />
      </svg>
      <span className="text-[11px] font-medium text-muted-foreground">Google Cloud</span>
    </span>
  );
}

/**
 * Blended top bar for non-wizard pages (Result, Video). No border or solid fill —
 * it sits transparently on the canvas so it reads as part of the page, not a chrome bar.
 * Renders as a flex child (not sticky) so it composes inside fixed-viewport layouts.
 */
interface AppHeaderProps {
  actions?: React.ReactNode;
  showGcpBadge?: boolean;
}

export default function AppHeader({ actions = null, showGcpBadge = true }: AppHeaderProps) {
  return (
    <header className="relative z-10 shrink-0">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-10">
        <Link
          to="/"
          aria-label="The Omni Portal"
          className="flex shrink-0 items-center gap-3 rounded-full focus-visible:outline-none"
        >
          <PortalMark />
          <span className="hidden sm:inline text-[15px] font-semibold tracking-tight text-foreground">
            The Omni Portal
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
          {showGcpBadge && <GcpBadge />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
