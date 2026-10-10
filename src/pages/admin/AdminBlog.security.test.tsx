import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/services/api', () => ({
  api: {
    getAllBlogPosts: vi.fn(async () => [
      {
        id: 'blog',
        title: 'Security fixture',
        slug: 'fixture',
        category: 'General',
        author: 'Editor',
        status: 'draft',
        views: 0,
          uniqueViews: 0,
          publishedAt: null,
        likes: 0,
        comments: 0,
        shares: 0,
        readTime: '1 min',
        isFeatured: false,
        tags: [],
        thumbnail: '',
        excerpt: 'Fixture excerpt',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        content:
          '<p>Safe paragraph</p><img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">unsafe link</a><svg onload="alert(1)"></svg>',
      },
    ]),
  },
}));
import { AdminBlog } from './AdminBlog';
function assertSafe(container: HTMLElement) {
  expect(container.querySelector('script')).toBeNull();
  expect(container.querySelector('[onerror],[onload],a[href^="javascript:"]')).toBeNull();
}
describe('Blog stored HTML sanitization', () => {
  it('sanitizes both drawer body and full preview while preserving prose', async () => {
    const { container } = render(<AdminBlog />);
    await waitFor(() => expect(screen.getByText('Security fixture')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Security fixture'));
    const contentTabs = screen.getAllByText('Content');
    fireEvent.click(contentTabs[0]);
    await waitFor(() => expect(screen.getByText('Safe paragraph')).toBeInTheDocument());
    assertSafe(container);
    fireEvent.click(screen.getByRole('button', { name: 'View Post' }));
    await waitFor(() => expect(screen.getAllByText('Safe paragraph')).toHaveLength(2));
    assertSafe(container);
  });
});
