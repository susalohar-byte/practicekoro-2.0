/** Encode untrusted text as one spreadsheet-safe, RFC 4180 CSV cell. */
export function csvCell(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return '"' + String(value) + '"';
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  // eslint-disable-next-line no-control-regex -- detect hidden prefixes in untrusted spreadsheet text
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^ *[\t\r\n]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
