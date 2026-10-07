/**
 * Pagination helper utilities for table views and list components.
 */

export type PageItem = number | 'ellipsis';

/**
 * Returns a windowed array of page numbers and ellipsis markers.
 * Guarantees first and last pages are always accessible, and the active
 * page window is centered when navigating through multiple pages.
 *
 * @param currentPage Current active page (1-indexed)
 * @param totalPages Total number of pages
 * @returns Array of page numbers and 'ellipsis' string markers
 */
export function getPageNumbers(currentPage: number, totalPages: number): PageItem[] {
  const safeTotal = Math.max(1, Math.floor(totalPages || 1));
  const safeCurrent = Math.max(1, Math.min(Math.floor(currentPage || 1), safeTotal));

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, i) => i + 1);
  }

  // When near the start
  if (safeCurrent <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', safeTotal];
  }

  // When near the end
  if (safeCurrent >= safeTotal - 3) {
    return [
      1,
      'ellipsis',
      safeTotal - 4,
      safeTotal - 3,
      safeTotal - 2,
      safeTotal - 1,
      safeTotal,
    ];
  }

  // In the middle
  return [
    1,
    'ellipsis',
    safeCurrent - 1,
    safeCurrent,
    safeCurrent + 1,
    'ellipsis',
    safeTotal,
  ];
}

/**
 * Computes safe display indices and pagination statistics for a list.
 */
export function calculatePaginationRange(
  currentPage: number,
  pageSize: number,
  totalItems: number
) {
  const safeTotalItems = Math.max(0, totalItems || 0);
  const safePageSize = Math.max(1, pageSize || 10);
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const clampedPage = Math.max(1, Math.min(currentPage || 1, totalPages));

  const startIndex = safeTotalItems === 0 ? 0 : (clampedPage - 1) * safePageSize + 1;
  const endIndex = Math.min(clampedPage * safePageSize, safeTotalItems);

  return {
    currentPage: clampedPage,
    pageSize: safePageSize,
    totalItems: safeTotalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPreviousPage: clampedPage > 1,
    hasNextPage: clampedPage < totalPages,
  };
}
