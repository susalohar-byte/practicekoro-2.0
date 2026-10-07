import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec("CREATE TABLE public.tests(id text PRIMARY KEY,title text); INSERT INTO public.tests VALUES('fixture','Unchanged title');");
  const sql = fs.readFileSync(new URL('../../supabase/migrations/20261007193234_add_icon_url_to_tests.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  assert.deepEqual((await db.query('SELECT id,title,icon_url FROM public.tests')).rows,[{id:'fixture',title:'Unchanged title',icon_url:null}]);
  await db.exec("UPDATE public.tests SET icon_url='https://fixture.example/icon.png' WHERE id='fixture';");
  assert.equal((await db.query('SELECT icon_url FROM public.tests')).rows[0].icon_url,'https://fixture.example/icon.png');
  await db.exec(sql); // Idempotent schema addition does not reset existing icons.
  assert.equal((await db.query('SELECT icon_url FROM public.tests')).rows[0].icon_url,'https://fixture.example/icon.png');
  await db.exec("UPDATE public.tests SET icon_url=NULL WHERE id='fixture';");
  assert.equal((await db.query('SELECT icon_url FROM public.tests')).rows[0].icon_url,null);
  console.log('PASS icon schema addition, unchanged old content, saved URL, idempotence and removal');
} finally { await db.close(); }
