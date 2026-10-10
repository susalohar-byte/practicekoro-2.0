// Isolated PostgreSQL fixture; never connects to production.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let checks = 0;
const eq = (a, b) => {
  assert.deepEqual(a, b);
  checks++;
};
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
 CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT true$$;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE TABLE profiles(id uuid PRIMARY KEY,email text,full_name text,role text,admin_role text,account_status text);
 CREATE TABLE user_roles(id uuid DEFAULT gen_random_uuid(),user_id uuid,role text);
 CREATE TABLE tests(id text PRIMARY KEY,status text,updated_at timestamptz);
 CREATE TABLE admin_audit_logs(id uuid DEFAULT gen_random_uuid(),admin_id uuid REFERENCES auth.users,
 admin_email text NOT NULL,admin_name text,admin_role text NOT NULL,action text NOT NULL,
 entity_type text NOT NULL,entity_id text,details jsonb,created_at timestamptz DEFAULT now());
 CREATE TABLE payment_gateways(id uuid DEFAULT gen_random_uuid(),gateway text,key_id text,is_active boolean,updated_at timestamptz);
 CREATE TABLE app_settings(id text PRIMARY KEY,value jsonb);
 CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);
 `);
  for (const t of [
    'payments',
    'subscriptions',
    'test_attempts',
    'test_results',
    'attempt_answers',
    'live_test_participants',
    'student_batches',
    'student_batch_members',
    'test_questions',
    'test_exams',
    'exam_topics',
  ])
    await db.exec(
      `CREATE TABLE ${t}(id uuid DEFAULT gen_random_uuid(),user_id uuid,attempt_id uuid,label text);`
    );
  const tables = [
    'profiles',
    'user_roles',
    'tests',
    'admin_audit_logs',
    'payment_gateways',
    'app_settings',
    'payments',
    'subscriptions',
    'test_attempts',
    'test_results',
    'attempt_answers',
    'live_test_participants',
    'student_batches',
    'student_batch_members',
    'test_questions',
    'test_exams',
    'exam_topics',
  ];
  for (const t of tables) {
    await db.exec(
      `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY; CREATE POLICY broad ON ${t} FOR ALL USING(true) WITH CHECK(true); GRANT ALL ON ${t} TO authenticated,service_role;`
    );
  }
  await db.exec(
    `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;CREATE POLICY broad ON storage.objects FOR ALL USING(true) WITH CHECK(true);GRANT ALL ON storage.objects TO authenticated,service_role; GRANT USAGE ON SCHEMA auth,storage TO anon,authenticated,service_role;`
  );
  for (let n = 1; n <= 6; n++) {
    await db.query(`INSERT INTO auth.users VALUES($1);`, [id(n)]);
    await db.query(`INSERT INTO profiles VALUES($1,$2,'Fixture','admin',$3,$4)`, [
      id(n),
      `fixture${n}@example.test`,
      ['super_admin', 'content_writer', 'support_agent', 'unknown', null, 'super_admin'][n - 1],
      n === 6 ? 'inactive' : 'active',
    ]);
    await db.query(`INSERT INTO user_roles(user_id,role) VALUES($1,'admin')`, [id(n)]);
  }
  await db.query(`INSERT INTO payments(user_id,label) VALUES($1,'private')`, [id(1)]);
  await db.exec(
    `INSERT INTO tests VALUES('fixture','published',now()); INSERT INTO payment_gateways(gateway,key_id,is_active) VALUES('razorpay','public-key',true);`
  );
  for (const f of [
    '20261010071456_admin_scope_authorization.sql',
    '20261010071514_server_mutation_auditing.sql',
  ])
    await db.exec(await readFile(`supabase/migrations/${f}`, 'utf8'));
  const login = async (n, role = 'authenticated') => {
    await db.exec('RESET ROLE');
    await db.query(
      `SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)`,
      [n ? id(n) : '', role]
    );
    await db.exec(`SET ROLE ${role}`);
  };
  const deny = async (q, args = []) => {
    await assert.rejects(
      () => db.query(q, args),
      /permissions|privileges|permission denied|row-level security/i
    );
    checks++;
  };
  const guarded = [
    `SELECT archive_test('fixture')`,
    `SELECT get_admin_payments()`,
    `SELECT get_admin_students()`,
    `SELECT get_admin_subscriptions()`,
    `SELECT bulk_assign_students_to_batch(gen_random_uuid(),ARRAY[]::uuid[])`,
    `SELECT admin_get_payment_gateway()`,
  ];
  for (let n = 2; n <= 6; n++) {
    await login(n);
    for (const q of guarded) await deny(q);
    eq((await db.query(`SELECT count(*)::int n FROM payments`)).rows[0].n, 0);
    eq((await db.query(`SELECT count(*)::int n FROM profiles`)).rows[0].n, 1);
    await deny(`INSERT INTO student_batches(label) VALUES('forbidden')`);
    await deny(
      `INSERT INTO admin_audit_logs(admin_email,admin_role,action,entity_type) VALUES('spoof','super_admin','fake','tests')`
    );
    eq((await db.query(`SELECT count(*)::int n FROM admin_audit_logs`)).rows[0].n, 0);
    eq((await db.query(`SELECT admin_scope_allowed('content') b`)).rows[0].b, n === 2);
  }
  await login(2);
  await db.exec(`INSERT INTO test_questions(label) VALUES('writer-content');`);
  await db.exec(
    `INSERT INTO storage.objects(bucket_id,name) VALUES('question-images','fixture.png')`
  );
  await login(3);
  await deny(`INSERT INTO test_questions(label) VALUES('support-content')`);
  await deny(`INSERT INTO storage.objects(bucket_id,name) VALUES('question-images','support.png')`);
  await login(1);
  eq((await db.query(`SELECT admin_scope_allowed('super') b`)).rows[0].b, true);
  eq((await db.query(`SELECT admin_scope_allowed('invented') b`)).rows[0].b, false);
  eq((await db.query(`SELECT admin_get_payment_gateway() j`)).rows[0].j.key_id, 'public-key');
  await db.query(`SELECT archive_test('fixture')`);
  let logs = (await db.query(`SELECT * FROM admin_audit_logs ORDER BY created_at`)).rows;
  eq(
    logs.some(
      (l) =>
        l.admin_id === id(1) && l.entity_type === 'tests' && l.details.source === 'database_trigger'
    ),
    true
  );
  eq(
    logs.some((l) => l.admin_id === id(2) && l.entity_type === 'test_questions'),
    true
  );
  eq(JSON.stringify(logs).includes('writer-content'), false);
  await deny(`DELETE FROM admin_audit_logs`);
  await deny(`UPDATE admin_audit_logs SET action='fake'`);
  await deny(
    `INSERT INTO admin_audit_logs(admin_email,admin_role,action,entity_type) VALUES('spoof','super_admin','fake','tests')`
  );
  // Audit persistence failure must roll back the original mutation.
  await db.exec(
    "RESET ROLE; ALTER TABLE admin_audit_logs ADD CONSTRAINT reject_fixture CHECK(entity_type<>'app_settings');"
  );
  await login(1);
  await assert.rejects(
    () => db.query(`INSERT INTO app_settings VALUES('secret','"sensitive-value"')`),
    /reject_fixture/
  );
  checks++;
  eq((await db.query(`SELECT count(*)::int n FROM app_settings`)).rows[0].n, 0);
  await db.exec('RESET ROLE; ALTER TABLE admin_audit_logs DROP CONSTRAINT reject_fixture;');
  await login(null, 'service_role');
  await db.exec(`INSERT INTO app_settings VALUES('fixture','"sensitive-value"')`);
  await db.exec('RESET ROLE');
  logs = (await db.query(`SELECT * FROM admin_audit_logs WHERE entity_type='app_settings'`)).rows;
  eq(logs[0].admin_id, null);
  eq(logs[0].admin_role, 'service_role');
  eq(JSON.stringify(logs).includes('sensitive-value'), false);
  // Self-demotion must still record the actor's pre-mutation role.
  await login(1);
  await db.query(`UPDATE profiles SET admin_role='content_writer' WHERE id=$1`, [id(1)]);
  await db.exec('RESET ROLE');
  const demotion = (await db.query(`SELECT * FROM admin_audit_logs WHERE entity_type='profiles' AND entity_id=$1 ORDER BY created_at DESC LIMIT 1`, [id(1)])).rows[0];
  eq(demotion.admin_role, 'super_admin');
  eq(demotion.details.changed_fields.includes('admin_role'), true);
  await db.exec(`SET request.jwt.claim.sub=''; SET request.jwt.claim.role='';`);
  const metadata = (await db.query(await readFile('supabase/tests/admin_scope_audit_permissions.sql','utf8'))).rows[0].security_checks;
  for (const value of Object.values(metadata)) eq(value, true);
  await login(null, 'anon');
  await deny(`SELECT admin_get_payment_gateway()`);
  console.log(`PASS: ${checks} scoped permissions/audit assertions (isolated fixture).`);
} finally {
  await db.close();
}
