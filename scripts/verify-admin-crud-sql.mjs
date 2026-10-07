// Disposable in-memory PostgreSQL only: never connects to Supabase or production.
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
import fs from 'node:fs';
const root = new URL('../', import.meta.url).pathname.replace(/\/$/, '');
const db = new PGlite();
try {
  await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role', true) $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
`);
  for (const file of [
    '001_initial_schema.sql',
    '002_rls_policies.sql',
    '011_role_source_of_truth.sql',
    '018_admin_v2_architecture.sql',
    '029_admin_roles_and_audit_logs.sql',
    '033_strictly_reset_student_roles_and_fix_admin.sql',
  ]) {
    if (file === '018_admin_v2_architecture.sql')
      await db.exec(
        'ALTER TABLE public.subscription_plans ADD COLUMN name text; ALTER TABLE public.subscription_plans ADD COLUMN currency text DEFAULT $$INR$$;'
      );
    let sql = fs
      .readFileSync(`${root}/supabase/migrations/${file}`, 'utf8')
      .replace(/CREATE EXTENSION IF NOT EXISTS "(?:pgcrypto|uuid-ossp)";/g, '');
    await db.exec(sql);
    console.log('baseline_loaded', file);
  }
  await db.exec(
    fs.readFileSync(
      `${root}/supabase/migrations/20261007073444_admin_management_persistence.sql`,
      'utf8'
    )
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS public.exam_categories(id text PRIMARY KEY,name text UNIQUE NOT NULL,order_index integer DEFAULT 0,created_at timestamptz DEFAULT now());`
  );
  await db.exec(
    fs.readFileSync(`${root}/supabase/migrations/20261007102947_student_internal_notes.sql`, 'utf8')
  );
  await db.exec(
    fs.readFileSync(`${root}/supabase/migrations/20261007102959_admin_crud_integrity.sql`, 'utf8')
  );
  console.log('crud_migration_loaded');
  await db.exec('ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_ids uuid[];');
  await db.exec(`SELECT set_config('request.jwt.claim.role','service_role',false);
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
('00000000-0000-0000-0000-000000000001','admin@practicekoro.online','{"full_name":"Primary"}'),
('00000000-0000-0000-0000-000000000002','learner@example.com','{"full_name":"Learner"}'),
('00000000-0000-0000-0000-000000000003','staff@example.com','{"full_name":"Staff"}');
INSERT INTO public.user_roles(user_id,role) VALUES('00000000-0000-0000-0000-000000000001','admin') ON CONFLICT DO NOTHING;
UPDATE public.profiles SET role='admin',admin_role='super_admin' WHERE id='00000000-0000-0000-0000-000000000001';
SELECT set_config('request.jwt.claim.role','authenticated',false), set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`);
  console.log('seeded');
  console.log(
    'assign',
    (
      await db.query(
        `SELECT public.assign_admin_staff_by_email('staff@example.com','support_agent') AS result`
      )
    ).rows[0].result.success
  );
  const ticket = (
    await db.query(
      `SELECT public.create_support_ticket('Learner','learner@example.com','Question','Please help','Other','medium') AS result`
    )
  ).rows[0].result.ticket;
  if (ticket.user_id !== '00000000-0000-0000-0000-000000000002')
    throw Error('Ticket assigned to wrong owner');
  await db.query(`SELECT public.send_support_ticket_message($1,'Public answer',false)`, [
    ticket.id,
  ]);
  await db.query(`SELECT public.send_support_ticket_message($1,'Private note',true)`, [ticket.id]);
  await db.exec(
    `SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`
  );
  let denied = false;
  try {
    await db.query(
      `SELECT public.assign_admin_staff_by_email('staff@example.com','support_agent')`
    );
  } catch {
    denied = true;
  }
  if (!denied) throw Error('Student staff assignment not blocked');
  await db.exec(
    `GRANT USAGE ON SCHEMA public,auth TO authenticated; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated; SET ROLE authenticated;`
  );
  const messages = (
    await db.query('SELECT body FROM public.support_ticket_messages ORDER BY created_at')
  ).rows;
  if (messages.length !== 1 || messages[0].body !== 'Public answer')
    throw Error('Internal note leaked');
  await db.exec(
    `RESET ROLE; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`
  );
  console.log(
    'demote',
    (
      await db.query(
        `SELECT public.remove_admin_staff_member('00000000-0000-0000-0000-000000000003') AS result`
      )
    ).rows[0].result.success
  );
  await db.exec(
    `SELECT set_config('request.jwt.claim.role','service_role',false); UPDATE public.profiles SET account_status='inactive' WHERE id='00000000-0000-0000-0000-000000000003'; SELECT set_config('request.jwt.claim.role','authenticated',false),set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);`
  );
  const active = (
    await db.query(
      `SELECT public.account_is_active(auth.uid()) AS value, public.has_role(auth.uid(),'student') AS student_role`
    )
  ).rows[0];
  if (active.value || active.student_role) throw Error('Inactive account retained role access');
  let statusDenied = false;
  try {
    await db.exec(`UPDATE public.profiles SET account_status='active' WHERE id=auth.uid()`);
  } catch {
    statusDenied = true;
  }
  if (!statusDenied) throw Error('Self-reactivation not blocked');
  await db.exec(
    `SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`
  );
  let primaryDenied = false;
  try {
    await db.query(`SELECT public.remove_admin_staff_member(auth.uid())`);
  } catch {
    primaryDenied = true;
  }
  if (!primaryDenied) throw Error('Primary removal not blocked');
  await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
CREATE TABLE IF NOT EXISTS public.exam_topics(exam_id text REFERENCES public.exams(id),topic_id text REFERENCES public.chapters(id),order_index int);
CREATE TABLE IF NOT EXISTS public.test_exams(test_id text REFERENCES public.tests(id),exam_id text REFERENCES public.exams(id),PRIMARY KEY(test_id,exam_id));
INSERT INTO public.exams(id,title,slug,category) VALUES('fixture-exam','Fixture','fixture','Other');
INSERT INTO public.subjects(id,exam_id,name,slug) VALUES('fixture-subject','fixture-exam','Fixture Subject','fixture-subject');
INSERT INTO public.chapters(id,subject_id,name,slug) VALUES('fixture-topic','fixture-subject','Fixture Topic','fixture-topic');`);
  const rejects = async (query, params = []) => {
    let failed = false;
    try {
      await db.query(query, params);
    } catch {
      failed = true;
    }
    if (!failed) throw Error('Expected SQL rejection: ' + query);
  };
  await rejects(`SELECT public.admin_delete_record('exams','fixture-exam')`);
  if (
    (await db.query(`SELECT id FROM public.subjects WHERE id='fixture-subject'`)).rows.length !== 1
  )
    throw Error('Dependency blocker damaged subject');
  await db.query(`SELECT public.admin_save_exam_topics('fixture-exam',ARRAY['fixture-topic'])`);
  await rejects(`SELECT public.admin_save_exam_topics('fixture-exam',ARRAY['missing'])`);
  if (
    (await db.query(`SELECT topic_id FROM public.exam_topics WHERE exam_id='fixture-exam'`)).rows[0]
      ?.topic_id !== 'fixture-topic'
  )
    throw Error('Topic rollback failed');
  await db.query(`SELECT public.admin_save_exam_topics('fixture-exam',ARRAY[]::text[])`);
  await db.query(`SELECT public.admin_delete_record('chapters','fixture-topic')`);
  await db.query(`SELECT public.admin_delete_record('subjects','fixture-subject')`);
  const deleted = (
    await db.query(`SELECT public.admin_delete_record('exams','fixture-exam') result`)
  ).rows[0].result;
  if (!deleted.success || deleted.deleted_id !== 'fixture-exam')
    throw Error('Delete ID confirmation failed');
  await rejects(`SELECT public.admin_delete_record('exams','fixture-exam')`);
  await rejects(
    `SELECT public.admin_delete_record('profiles','00000000-0000-0000-0000-000000000002')`
  );
  let post = (
    await db.query(
      `SELECT public.admin_mutate_collection('blog','create',NULL,'{"title":"Fixture Post","slug":"fixture-post"}'::jsonb) result`
    )
  ).rows[0].result.record;
  if (!/^[a-f0-9-]{36}$/.test(post.id)) throw Error('Collection ID was not database UUID');
  await rejects(
    `SELECT public.admin_mutate_collection('blog','create',NULL,'{"title":"Duplicate","slug":"fixture-post"}'::jsonb)`
  );
  await db.query(
    `SELECT public.admin_mutate_collection('blog','update',$1,'{"title":"Renamed"}'::jsonb)`,
    [post.id]
  );
  await db.query(`SELECT public.admin_mutate_collection('blog','delete',$1)`, [post.id]);
  await rejects(`SELECT public.admin_mutate_collection('blog','delete',$1)`, [post.id]);
  await db.exec(
    `SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`
  );
  await rejects(`SELECT public.admin_delete_record('exams','fixture-exam')`);
  await rejects(
    `SELECT public.admin_mutate_collection('banners','create',NULL,'{"title":"Forbidden"}'::jsonb)`
  );
  await rejects(
    `SELECT public.admin_update_app_settings('[{"id":"general_app_name","value":"Unauthorized"}]')`
  );
  await db.exec(
    `SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)`
  );
  await rejects(
    `SELECT public.admin_update_app_settings('[{"id":"smtp_password","value":"not-a-real-secret"}]')`
  );
  await db.exec(
    `INSERT INTO public.student_notes(student_id,author_id,note) VALUES('00000000-0000-0000-0000-000000000002',auth.uid(),'Private fixture note');SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);SET ROLE authenticated;`
  );
  if ((await db.query('SELECT * FROM public.student_notes')).rows.length)
    throw Error('Internal notes leaked to student');
  await db.exec('RESET ROLE');
  await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
INSERT INTO public.exams(id,title,slug,category) VALUES('fixture-test-exam','Fixture test exam','fixture-test-exam','Other');
INSERT INTO public.test_series(id,exam_id,title,slug) VALUES('fixture-series','fixture-test-exam','Fixture series','fixture-series');
INSERT INTO public.tests(id,exam_id,title,slug,test_type) VALUES('fixture-test','fixture-test-exam','Fixture test','fixture-test','full_mock');
INSERT INTO public.questions(id,question_text,option_a,option_b,option_c,option_d,correct_option) VALUES('00000000-0000-0000-0000-000000000101','Fixture question','A','B','C','D','A');`);
  const targeted = (
    await db.query(
      `SELECT public.create_targeted_notification('Fixture title','Fixture message','in_app',ARRAY['00000000-0000-0000-0000-000000000002'::uuid]) result`
    )
  ).rows[0].result;
  if (!targeted) throw Error('Targeted notification ID missing');
  await rejects(
    `SELECT public.create_targeted_notification('Fixture title','Fixture message','push',ARRAY['00000000-0000-0000-0000-000000000002'::uuid])`
  );
  const questionPayload = JSON.stringify([
    { question_id: '00000000-0000-0000-0000-000000000101', marks: 2, question_order: 1 },
  ]);
  await db.query(`SELECT public.save_test_questions('fixture-test',$1::jsonb)`, [questionPayload]);
  await rejects(`SELECT public.save_test_questions('fixture-test',$1::jsonb)`, [
    JSON.stringify([{ question_id: '00000000-0000-0000-0000-000000000199', marks: 2 }]),
  ]);
  if (
    (
      await db.query(
        `SELECT question_id,marks,negative_marks FROM public.test_questions WHERE test_id='fixture-test'`
      )
    ).rows[0]?.question_id !== '00000000-0000-0000-0000-000000000101'
  )
    throw Error('Question assignment rollback failed');
  await rejects(
    `SELECT public.admin_delete_record('questions','00000000-0000-0000-0000-000000000101')`
  );
  await rejects(`SELECT public.admin_delete_record('tests','fixture-test')`);
  await db.query(`SELECT public.admin_save_test_exams('fixture-test',ARRAY['fixture-test-exam'])`);
  await rejects(`SELECT public.admin_save_test_exams('fixture-test',ARRAY['missing-exam'])`);
  if (
    (await db.query(`SELECT exam_id FROM public.test_exams WHERE test_id='fixture-test'`)).rows[0]
      ?.exam_id !== 'fixture-test-exam'
  )
    throw Error('Test exam rollback failed');
  await db.query(`SELECT public.admin_assign_series_tests(ARRAY['fixture-test'],'fixture-series')`);
  await rejects(
    `SELECT public.admin_assign_series_tests(ARRAY['fixture-test','missing-test'],NULL)`
  );
  if (
    (await db.query(`SELECT test_series_id FROM public.tests WHERE id='fixture-test'`)).rows[0]
      ?.test_series_id !== 'fixture-series'
  )
    throw Error('Series assignment partial write');
  await db.exec(`INSERT INTO public.subscription_plans(id,title,duration_days,price) VALUES('fixture-plan','Fixture plan',30,0);
INSERT INTO public.subscriptions(id,user_id,plan_id,expires_at) VALUES('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000002','fixture-plan',now()+interval '3 days');`);
  const expBefore = (
    await db.query(
      `SELECT expires_at FROM public.subscriptions WHERE id='00000000-0000-0000-0000-000000000201'`
    )
  ).rows[0].expires_at;
  const extension = (
    await db.query(
      `SELECT public.admin_modify_subscription('00000000-0000-0000-0000-000000000201','extend',30,NULL) result`
    )
  ).rows[0].result;
  if (new Date(extension.expires_at) - new Date(expBefore) !== 30 * 86400000)
    throw Error('Subscription duration incorrect');
  await rejects(`SELECT public.admin_modify_subscription('missing','extend',30,NULL)`);
  await rejects(
    `SELECT public.admin_modify_subscription('00000000-0000-0000-0000-000000000201','plan',NULL,'missing-plan')`
  );
  await rejects(`SELECT public.admin_delete_record('subscription_plans','fixture-plan')`);
  await db.exec(
    `SELECT set_config('request.jwt.claim.role','service_role',false);INSERT INTO public.user_roles(user_id,role) VALUES('00000000-0000-0000-0000-000000000003','admin') ON CONFLICT DO NOTHING;UPDATE public.profiles SET role='admin',admin_role='content_writer',account_status='active' WHERE id='00000000-0000-0000-0000-000000000003';SELECT set_config('request.jwt.claim.role','authenticated',false);SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false)`
  );
  await rejects(
    `SELECT public.admin_modify_subscription('00000000-0000-0000-0000-000000000201','extend',30,NULL)`
  );
  await rejects(`SELECT public.admin_delete_record('tests','fixture-test')`);
  if (
    !(
      await db.query(
        `SELECT public.can_mutate_admin_record('exams') allowed,public.can_mutate_admin_record('subscriptions') financial`
      )
    ).rows[0].allowed ||
    (await db.query(`SELECT public.can_mutate_admin_record('subscriptions') allowed`)).rows[0]
      .allowed
  )
    throw Error('Staff permissions incorrect');
  console.log(
    'Extended SQL assertions passed: question/exam association rollback, linked question/test protection, atomic series assignment, real subscription extension, missing rows/plans, financial-role denial'
  );

  console.log(
    'CRUD SQL assertions passed: protected FK deletion, real delete IDs, zero-row errors, atomic mapping rollback, UUID collection CRUD, duplicate slugs, unauthorized calls, credential restrictions, private notes'
  );

  console.log(
    'SQL assertions passed: ownership, reply persistence, note privacy, staff assignment/removal, student authorization, inactive roles, self-reactivation denial, primary protection'
  );
} catch (error) {
  console.error('DB_VALIDATION_FAILED', error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
