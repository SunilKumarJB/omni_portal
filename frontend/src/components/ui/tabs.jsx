import * as TabsPrimitive from '@radix-ui/react-tabs';
import React from 'react';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ref, ...props }) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('flex items-center border-b border-border', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ref, ...props }) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap -mb-px border-b-2 border-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors [touch-action:manipulation]',
        'hover:text-foreground/85 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:border-foreground data-[state=active]:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ref, ...props }) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('mt-6 focus-visible:outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
