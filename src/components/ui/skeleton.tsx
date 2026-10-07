import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/** shadcn-style visual placeholder; its enclosing loading region supplies semantics. */
export const Skeleton = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-pulse motion-reduce:animate-none rounded-md bg-slate-200/70 dark:bg-slate-800',
        className
      )}
    />
  )
);
Skeleton.displayName = 'Skeleton';
