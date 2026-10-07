// Disposable PostgreSQL fixture only. No credentials or production connection.
// Install @electric-sql/pglite in a separate validation folder and set PGLITE_MODULE
// to its dist/index.js if it is not installed in this repository.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    SET TIME ZONE 'UTC'; CREATE SCHEMA auth; CREATE ROLE authenticated; CREATE ROLE anon;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '00000000-0000-0000-0000-000000000001'::uuid $$;
    CREATE FUNCTION public.is_management_super_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION public.can_mutate_admin_record(text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE TABLE public.payments(id uuid,user_id uuid,amount numeric,refund_amount numeric,status text,created_at timestamptz);
    CREATE TABLE public.profiles(id uuid,role text,full_name text,email text,created_at timestamptz);
    CREATE TABLE public.test_attempts(user_id uuid,status text,correct_count integer,wrong_count integer,created_at timestamptz);
    CREATE TABLE public.subscriptions(id uuid,user_id uuid,status text,expires_at timestamptz,created_at timestamptz);
    CREATE TABLE public.exams(id text,title text,created_at timestamptz);
    CREATE TABLE public.tests(id text,title text,test_type text,created_at timestamptz);
    CREATE TABLE public.questions(chapter_id text,source_type text);
    CREATE TABLE public.attempt_answers(selected_option text);
    INSERT INTO public.payments(id,amount,refund_amount,status,created_at)
      SELECT '00000000-0000-0000-0000-000000000002',100,30,'completed',
        ((now() AT TIME ZONE 'Asia/Kolkata')::date::timestamp AT TIME ZONE 'Asia/Kolkata') + interval '1 hour';
    INSERT INTO public.payments(amount,refund_amount,status,created_at)
      VALUES(999,0,'pending',now()),(999,0,'failed',now()),(999,999,'refunded',now());
    INSERT INTO public.attempt_answers VALUES (null),('A');
    INSERT INTO public.profiles VALUES('00000000-0000-0000-0000-000000000001','student','Student','s@example.test',now()),
      ('00000000-0000-0000-0000-000000000003','admin','Admin','a@example.test',now());
    INSERT INTO public.subscriptions(id,user_id,status,expires_at,created_at)
      SELECT gen_random_uuid(),'00000000-0000-0000-0000-000000000001','active',now()+interval '1 day',now() FROM generate_series(1,2);
  `);
  await db.exec(
    fs.readFileSync(
      new URL(
        '../../supabase/migrations/20261007151053_update_admin_dashboard_v2_stats.sql',
        import.meta.url
      ),
      'utf8'
    )
  );
  for (const zone of ['UTC', 'Asia/Kolkata', 'America/New_York']) {
    await db.exec(`SET TIME ZONE '${zone}'`);
    const { stats } = (await db.query('SELECT public.get_admin_dashboard_v2_stats() AS stats'))
      .rows[0];
    assert.equal(stats.totalRevenue, 70);
    assert.equal(stats.todayRevenue, 70);
    assert.equal(stats.monthRevenue, 70);
    assert.equal(stats.yearRevenue, 70);
    assert.equal(stats.questionsAnswered, 1);
    assert.equal(stats.totalStudents, 1);
    assert.equal(stats.proStudents, 1);
    assert.equal(stats.activeSubscriptions, 2);
    console.log(
      `PASS ${zone}: 01:00 IST revenue, refunds, actual answers, student role and distinct Pro users`
    );
  }
  const permissions = (
    await db.query(`SELECT has_function_privilege('anon','public.get_admin_dashboard_v2_stats()','EXECUTE') AS anon_allowed,
    has_function_privilege('authenticated','public.get_admin_dashboard_v2_stats()','EXECUTE') AS authenticated_allowed`)
  ).rows[0];
  assert.equal(permissions.anon_allowed, false);
  assert.equal(permissions.authenticated_allowed, true);
  await db.exec(
    'CREATE OR REPLACE FUNCTION public.is_management_super_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$'
  );
  await assert.rejects(db.query('SELECT public.get_admin_dashboard_v2_stats()'), /Forbidden/);
  await db.exec(
    'CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$'
  );
  await assert.rejects(db.query('SELECT public.get_admin_dashboard_v2_stats()'), /Forbidden/);
  console.log(
    'PASS anonymous grant denied, authenticated grant scoped, non-admin and null identity rejected'
  );
} finally {
  await db.close();
}
