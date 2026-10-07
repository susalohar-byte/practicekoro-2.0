// Disposable in-memory PostgreSQL-compatible fixture. No network or production data.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`CREATE TABLE subjects(id text primary key,exam_id text,name text,slug text, UNIQUE(exam_id,slug));
INSERT INTO subjects VALUES ('global',NULL,'Math','math'),('exam-a','a','Math','math'),('exam-b','b','Math','math');`);
await db.exec(await readFile('supabase/migrations/20261007203000_subjects_global_slug_guard.sql','utf8'));
await assert.rejects(()=>db.exec(`INSERT INTO subjects VALUES ('duplicate',NULL,'Duplicate',' Math ');`),/duplicate key/);
await db.exec(`INSERT INTO subjects VALUES ('different',NULL,'Physics','physics');`);
assert.equal((await db.query('SELECT count(*)::integer as n FROM subjects')).rows[0].n,4);
await assert.rejects(()=>db.exec(`UPDATE subjects SET slug='MATH' WHERE id='different';`),/duplicate key/);
assert.equal((await db.query("SELECT slug FROM subjects WHERE id='different'")).rows[0].slug,'physics');
await db.exec(await readFile('supabase/migrations/20261007203000_subjects_global_slug_guard.sql','utf8'));
await db.close();
console.log('PASS: global slug duplicates rejected, scoped subjects preserved, failed edit rolled back, reapply safe.');
