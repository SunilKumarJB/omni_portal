import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * Monochrome portal mark. Uses currentColor so it inverts cleanly with the theme.
 */
function PortalMark() {
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
 * otherwise black-and-white shell (GML "Four Color Accent" usage).
 */
function GcpBadge() {
  return (
    <span className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5">
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
 * Shared application header used across Home, ResultPanel and VideoView.
 * `actions` renders custom controls (e.g. test-mode switch, "Create another")
 * to the left of the persistent theme toggle.
 */
export default function AppHeader({ actions = null, showGcpBadge = true }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 rounded-full focus-visible:outline-none">
          <PortalMark />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            The Omni Portal
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {actions}
          {showGcpBadge && <GcpBadge />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
