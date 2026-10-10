import { describe, it, expect } from 'vitest';
import { csvCell } from './csvExport';
import { getAdminPermissions, type AdminRole } from '@/types';
describe('spreadsheet-safe CSV', () => {
  it.each([
    '=SUM(1,2)',
    '+cmd',
    '-cmd',
    '@SUM(1)',
    '  =cmd',
    '\t=cmd',
    '\ncmd',
    '\r@cmd',
    '\u0000=cmd',
  ])('neutralizes formula/control prefix %j', (value) =>
    expect(csvCell(value).startsWith('"\'')).toBe(true)
  );
  it('escapes quotes/newlines without changing column boundaries', () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell('বাংলা # test')).toBe('"বাংলা # test"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(-42)).toBe('"-42"');
    expect(csvCell('-42')).toBe('"\'-42"');
  });
});
describe('fail-closed permission matrix', () => {
  it.each([undefined, null, '', 'administrator', 'SUPER_ADMIN'])(
    'denies unknown role %j',
    (role) => {
      expect(Object.values(getAdminPermissions(role as AdminRole)).every((v) => !v)).toBe(true);
    }
  );
});
