import type { Subject } from '@/types';
import { validateSubjectInput } from './adminSubjectModel';
export const subjectCsvTemplate =
  'name,slug,category,description,isActive,orderIndex\nExample Subject,example-subject,General,"Example description",false,1\n';
function csv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (quoted || value === '') quoted = !quoted;
      else throw new Error('Invalid CSV quoting.');
    } else if (!quoted && c === ',') {
      row.push(value);
      value = '';
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(value);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      value = '';
    } else value += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote.');
  row.push(value);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export function parseSubjectImport(
  text: string,
  filename: string,
  nextOrder = 1
): Omit<Subject, 'id'>[] {
  if (new TextEncoder().encode(text).length > 5 * 1024 * 1024)
    throw new Error('Import file must be at most 5 MB.');
  let inputs: Record<string, unknown>[];
  if (filename.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('JSON must contain an array of subjects.');
    inputs = parsed;
  } else if (filename.toLowerCase().endsWith('.csv')) {
    const [header, ...rows] = csv(text.replace(/^\uFEFF/, ''));
    if (!header) throw new Error('File is empty.');
    const keys = header.map((h) => h.trim());
    if (new Set(keys).size !== keys.length) throw new Error('Duplicate CSV columns.');
    inputs = rows.map((r, i) => {
      if (r.length !== keys.length) throw new Error(`Row ${i + 2} has the wrong column count.`);
      return Object.fromEntries(keys.map((k, j) => [k, r[j]]));
    });
  } else throw new Error('Choose a .csv or .json file.');
  if (!inputs.length || inputs.length > 100) throw new Error('Import 1–100 subjects per file.');
  const slugs = new Set<string>();
  const allowed = [
    'name',
    'slug',
    'category',
    'description',
    'iconName',
    'isActive',
    'orderIndex',
    'examId',
  ];
  return inputs.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row))
      throw new Error(`Row ${index + 1} is not a subject object.`);
    if (Object.keys(row).some((k) => !allowed.includes(k)))
      throw new Error(`Row ${index + 1} contains unsupported columns.`);
    if (typeof row.name !== 'string' || (row.slug !== undefined && typeof row.slug !== 'string'))
      throw new Error(`Row ${index + 1}: name/slug must be text.`);
    for (const key of ['category', 'description', 'iconName', 'examId'])
      if (row[key] != null && typeof row[key] !== 'string')
        throw new Error(`Row ${index + 1}: ${key} must be text.`);
    const active = row.isActive;
    if (
      active != null &&
      active !== '' &&
      ![true, false, 'true', 'false'].includes(active as never)
    )
      throw new Error(`Row ${index + 1}: isActive must be true or false.`);
    const item: Omit<Subject, 'id'> = {
      name: row.name.trim(),
      slug: String(
        row.slug ||
          row.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
      ),
      category: String(row.category || 'General'),
      description: String(row.description || ''),
      iconName: String(row.iconName || 'BookOpen'),
      isActive: active === true || active === 'true',
      orderIndex:
        row.orderIndex == null || row.orderIndex === ''
          ? nextOrder + index
          : Number(row.orderIndex),
      examId: row.examId ? String(row.examId) : undefined,
    };
    validateSubjectInput(item);
    const key = `${item.examId || ''}:${item.slug}`;
    if (slugs.has(key)) throw new Error(`Duplicate slug in import: ${item.slug}`);
    slugs.add(key);
    return item;
  });
}
