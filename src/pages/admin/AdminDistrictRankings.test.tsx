import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDistrictRankings } from './AdminDistrictRankings';

// Mock API
vi.mock('@/services/api', () => ({
  api: {
    getAppLeaderboard: vi.fn().mockResolvedValue([]),
  },
}));

describe('AdminDistrictRankings - 23 Districts Pagination & View Modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('paginates 23 districts across 3 pages (10 per page) and updates rows when clicking pages', async () => {
    render(
      <MemoryRouter>
        <AdminDistrictRankings />
      </MemoryRouter>
    );

    // Wait for initial load to finish past skeleton
    await waitFor(() => {
      expect(screen.getByText('Showing 1–10 of 23 districts')).toBeInTheDocument();
    });

    const tables = screen.getAllByRole('table');
    const districtTable = tables[0];

    // Page 1 should show 1–10 of 23 districts by default
    expect(within(districtTable).getByText('Purulia')).toBeInTheDocument(); // Rank 1
    expect(within(districtTable).getByText('Birbhum')).toBeInTheDocument(); // Rank 10
    expect(within(districtTable).queryByText('Kolkata')).not.toBeInTheDocument(); // Rank 11 (on page 2)
    expect(within(districtTable).queryByText('Purba Bardhaman')).not.toBeInTheDocument(); // Rank 23 (on page 3)

    // Check pagination buttons exist for all 3 pages
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();

    // Navigate to Page 2
    const page2Button = screen.getByRole('button', { name: 'Page 2' });
    fireEvent.click(page2Button);

    expect(screen.getByText('Showing 11–20 of 23 districts')).toBeInTheDocument();
    expect(within(districtTable).queryByText('Purulia')).not.toBeInTheDocument(); // Rank 1 gone
    expect(within(districtTable).getByText('Kolkata')).toBeInTheDocument(); // Rank 11 appears
    expect(within(districtTable).getByText('Kalimpong')).toBeInTheDocument(); // Rank 20 appears
    expect(within(districtTable).queryByText('Purba Bardhaman')).not.toBeInTheDocument(); // Rank 23 (on page 3)

    // Navigate to Page 3
    const page3Button = screen.getByRole('button', { name: 'Page 3' });
    fireEvent.click(page3Button);

    expect(screen.getByText('Showing 21–23 of 23 districts')).toBeInTheDocument();
    expect(within(districtTable).queryByText('Kolkata')).not.toBeInTheDocument();
    expect(within(districtTable).getByText('Jhargram')).toBeInTheDocument(); // Rank 21
    expect(within(districtTable).getByText('Purba Medinipur')).toBeInTheDocument(); // Rank 22
    expect(within(districtTable).getByText('Purba Bardhaman')).toBeInTheDocument(); // Rank 23

    // Next page should be disabled on page 3
    const nextButton = screen.getByRole('button', { name: 'Next page' });
    expect(nextButton).toBeDisabled();

    // Previous page should navigate back to Page 2
    const prevButton = screen.getByRole('button', { name: 'Previous page' });
    fireEvent.click(prevButton);
    expect(screen.getByText('Showing 11–20 of 23 districts')).toBeInTheDocument();
    expect(within(districtTable).getByText('Kolkata')).toBeInTheDocument();
  });

  it('switches to All (23 Districts) and displays all districts in continuous scroll view', async () => {
    render(
      <MemoryRouter>
        <AdminDistrictRankings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Districts per page')).toBeInTheDocument();
    });

    const pageSizeSelect = screen.getByLabelText('Districts per page');

    // Switch to All (23 Districts)
    fireEvent.change(pageSizeSelect, { target: { value: 'all' } });

    expect(screen.getByText('Showing all 23 districts of West Bengal')).toBeInTheDocument();
    expect(screen.getByText('Scroll to view all 23 districts')).toBeInTheDocument();

    const tables = screen.getAllByRole('table');
    const districtTable = tables[0];

    // All districts from 1 to 23 are now visible in one scrollable list
    expect(within(districtTable).getByText('Purulia')).toBeInTheDocument(); // Rank 1
    expect(within(districtTable).getByText('Kolkata')).toBeInTheDocument(); // Rank 11
    expect(within(districtTable).getByText('Purba Bardhaman')).toBeInTheDocument(); // Rank 23
  });

  it('filters by district correctly and updates summary count', async () => {
    render(
      <MemoryRouter>
        <AdminDistrictRankings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Select District')).toBeInTheDocument();
    });

    const districtFilter = screen.getByLabelText('Select District');
    fireEvent.change(districtFilter, { target: { value: 'Kolkata' } });

    const tables = screen.getAllByRole('table');
    const districtTable = tables[0];

    expect(screen.getByText('Showing 1–1 of 1 districts')).toBeInTheDocument();
    expect(within(districtTable).getByText('Kolkata')).toBeInTheDocument();
    expect(within(districtTable).queryByText('Purulia')).not.toBeInTheDocument();
  });
});
