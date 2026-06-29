import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Flips the brand's polarity (the GML system is defined in both black-on-white
 * and white-on-black). Defaults to dark; the choice persists via next-themes.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration/icon mismatch before the theme is known.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Switch to ${next} theme`}
          onClick={() => setTheme(next)}
          className="h-9 w-9 rounded-full"
        >
          {mounted ? (
            isDark ? (
              <Sun className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.75} />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {mounted ? `${next[0].toUpperCase()}${next.slice(1)} theme` : 'Theme'}
      </TooltipContent>
    </Tooltip>
  );
}
