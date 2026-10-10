import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';
afterEach(cleanup);
describe('Student mobile navigation', () => {
  it('preserves the five canonical destinations with a visible active state', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <BottomNav />
      </MemoryRouter>
    );
    const nav = screen.getByRole('navigation', { name: 'Mobile Bottom Navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(within(nav).getByRole('link', { name: 'Practice' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    for (const [name, href] of [
      ['Home', '/dashboard'],
      ['Test Series', '/test-series'],
      ['Practice', '/practice'],
      ['Results', '/results'],
      ['Profile', '/profile'],
    ]) {
      expect(within(nav).getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });
  it('marks nested results pages without creating multiple current links', () => {
    render(
      <MemoryRouter initialEntries={['/results']}>
        <BottomNav />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Results' })).toHaveAttribute('aria-current', 'page');
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
});
