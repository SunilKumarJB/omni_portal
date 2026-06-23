import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import React from 'react';
import { cn } from '@/lib/utils';

function ScrollBar({ className, orientation = 'vertical', ref, ...props }) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors',
        orientation === 'vertical' && 'h-full w-1.5 border-l border-l-transparent p-px',
        orientation === 'horizontal' && 'h-1.5 flex-col border-t border-t-transparent p-px',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-foreground/20" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

function ScrollArea({ className, children, ref, ...props }) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export { ScrollArea, ScrollBar };
