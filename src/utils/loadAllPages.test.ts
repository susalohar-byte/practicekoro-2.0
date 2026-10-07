import { describe, expect, it, vi } from 'vitest';
import { loadAllPages } from './loadAllPages';
import { parseStudentCsv } from './parseStudentCsv';
describe('complete server pagination', () => {
  it('loads records beyond the old 50/200 limits', async () => {
    const source = Array.from({ length: 237 }, (_, id) => ({ id }));
    const page = vi.fn(async (limit: number, offset: number) =>
      source.slice(offset, offset + limit)
    );
    expect(await loadAllPages(page)).toEqual(source);
    expect(page).toHaveBeenLastCalledWith(50, 250);
  });
  it('continues past short filtered pages until the server returns no rows', async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'a' }])
      .mockResolvedValueOnce([{ id: 'b' }])
      .mockResolvedValueOnce([]);
    expect(await loadAllPages(page)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
  it('rejects a failed later page rather than exporting a partial dataset', async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'a' }])
      .mockRejectedValueOnce(new Error('Read failed'));
    await expect(loadAllPages(page)).rejects.toThrow('Read failed');
  });
  it('rejects a server that repeats a page indefinitely', async () => {
    await expect(loadAllPages(async () => [{ id: 'a' }])).rejects.toThrow('did not advance');
  });
});
describe('student CSV parser', () => {
  it('retains quoted commas and escaped quotes', () => {
    expect(parseStudentCsv('Name,Email,Location\r\n"A ""B""",a@example.com,"Kolkata, WB"')).toEqual(
      [
        ['Name', 'Email', 'Location'],
        ['A "B"', 'a@example.com', 'Kolkata, WB'],
      ]
    );
  });
  it('rejects unclosed quoted fields', () => {
    expect(() => parseStudentCsv('"Broken')).toThrow('unclosed');
  });
});
