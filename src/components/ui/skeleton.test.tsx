import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './skeleton';
describe('Skeleton primitive', () => {
  it('supports shadcn-style usage, custom attributes and merged classes', () => {
    const { container } = render(
      <Skeleton className="h-[20px] w-[100px] rounded-full" data-testid="shape" />
    );
    const shape = container.firstElementChild;
    expect(shape).toHaveAttribute('data-slot', 'skeleton');
    expect(shape).toHaveAttribute('aria-hidden', 'true');
    expect(shape).toHaveClass(
      'rounded-full',
      'h-[20px]',
      'w-[100px]',
      'animate-pulse',
      'motion-reduce:animate-none',
      'dark:bg-slate-800'
    );
    expect(shape).not.toHaveClass('rounded-md');
  });
});
