import { act, cleanup, render } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';
let context: ReturnType<typeof useTheme>;
const listeners = new Set<() => void>();
let dark = false;
function Probe() {
  context = useTheme();
  return null;
}
beforeEach(() => {
  localStorage.clear();
  dark = false;
  listeners.clear();
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return dark;
    },
    addEventListener: (_e: string, f: () => void) => listeners.add(f),
    removeEventListener: (_e: string, f: () => void) => listeners.delete(f),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
it('applies the platform default without writing a fake personal preference', () => {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
  act(() => context.setPlatformDefault('dark'));
  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem('pk_theme')).toBeNull();
});
it('preserves explicit user theme choices across platform default changes', () => {
  localStorage.setItem('pk_theme', 'light');
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
  act(() => context.setPlatformDefault('dark'));
  expect(context.resolvedTheme).toBe('light');
  act(() => context.toggleTheme());
  expect(context.resolvedTheme).toBe('dark');
  expect(localStorage.getItem('pk_theme')).toBe('dark');
});
it('tracks device theme when System is selected and cleans up listeners', () => {
  const r = render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
  act(() => {
    dark = true;
    listeners.forEach((f) => f());
  });
  expect(context.resolvedTheme).toBe('dark');
  r.unmount();
  expect(listeners.size).toBe(0);
});
