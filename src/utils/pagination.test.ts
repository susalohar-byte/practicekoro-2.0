import { describe, it, expect } from 'vitest';
import { getPageNumbers, calculatePaginationRange } from './pagination';

describe('getPageNumbers', () => {
  it('returns [1] when totalPages is 0 or 1', () => {
    expect(getPageNumbers(1, 0)).toEqual([1]);
    expect(getPageNumbers(1, 1)).toEqual([1]);
  });

  it('returns all pages when totalPages <= 7', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('windowing near the beginning when totalPages > 7', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(getPageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
  });

  it('windowing near the end when totalPages > 7', () => {
    expect(getPageNumbers(7, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
    expect(getPageNumbers(10, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
  });

  it('windowing in the middle when totalPages > 7', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(getPageNumbers(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
  });

  it('handles negative or invalid inputs gracefully', () => {
    expect(getPageNumbers(-2, -5)).toEqual([1]);
  });
});

describe('calculatePaginationRange', () => {
  it('handles empty lists (0 items)', () => {
    const res = calculatePaginationRange(1, 10, 0);
    expect(res.startIndex).toBe(0);
    expect(res.endIndex).toBe(0);
    expect(res.totalPages).toBe(1);
    expect(res.hasPreviousPage).toBe(false);
    expect(res.hasNextPage).toBe(false);
  });

  it('calculates indices for page 1 correctly', () => {
    const res = calculatePaginationRange(1, 10, 35);
    expect(res.startIndex).toBe(1);
    expect(res.endIndex).toBe(10);
    expect(res.totalPages).toBe(4);
    expect(res.hasPreviousPage).toBe(false);
    expect(res.hasNextPage).toBe(true);
  });

  it('calculates indices for last page correctly', () => {
    const res = calculatePaginationRange(4, 10, 35);
    expect(res.startIndex).toBe(31);
    expect(res.endIndex).toBe(35);
    expect(res.totalPages).toBe(4);
    expect(res.hasPreviousPage).toBe(true);
    expect(res.hasNextPage).toBe(false);
  });

  it('clamps currentPage to totalPages if currentPage is out of bounds', () => {
    const res = calculatePaginationRange(10, 10, 35);
    expect(res.currentPage).toBe(4);
    expect(res.startIndex).toBe(31);
    expect(res.endIndex).toBe(35);
  });
});
