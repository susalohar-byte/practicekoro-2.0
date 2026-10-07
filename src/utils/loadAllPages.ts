/** Read every server page; never treat an error/repeated page as a complete export. */
export async function loadAllPages<T extends { id: string | number }>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
  pageSize = 50
): Promise<T[]> {
  const result: T[] = [];
  const seen = new Set<string>();
  for (let page = 0; page < 10000; page++) {
    const rows = await fetchPage(pageSize, page * pageSize);
    if (!Array.isArray(rows)) throw new Error('Invalid paginated response.');
    if (!rows.length) return result;
    let added = 0;
    for (const row of rows) {
      const id = String(row.id);
      if (!seen.has(id)) {
        seen.add(id);
        result.push(row);
        added++;
      }
    }
    if (!added)
      throw new Error('Server pagination did not advance. No complete dataset was loaded.');
    // Continue even after a short filtered page: only an empty server page ends retrieval.
  }
  throw new Error('Record limit reached. Refine the query before exporting.');
}
