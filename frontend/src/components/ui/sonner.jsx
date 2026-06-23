import { useTheme } from 'next-themes';
import React from 'react';
import { Toaster as Sonner } from 'sonner';

/**
 * App-wide toast surface. Inherits the active theme so toasts read correctly
 * in both polarities; colors come from our CSS tokens, not Sonner defaults.
 */
function Toaster(props) {
  const { theme = 'dark' } = useTheme();
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:border-destructive/40',
          success: 'group-[.toaster]:border-success/40',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
