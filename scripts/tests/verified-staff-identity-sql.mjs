// Disposable PostgreSQL with the existing role/profile triggers. No production access.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let assertions = 0;
const equal = (a,b) => { assert.deepEqual(a,b); assertions++; };
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const rejected = async (sql,params,pattern) => {
  await assert.rejects(()=>db.query(sql,params),pattern); assertions++;
};
try {
  await db.exec(`
    CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,
      email_confirmed_at timestamptz,banned_until timestamptz,email_change text,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role',true)
    $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
  `);
  for (const file of ['001_initial_schema.sql','002_rls_policies.sql','011_role_source_of_truth.sql',
    '018_admin_v2_architecture.sql','029_admin_roles_and_audit_logs.sql',
    '033_strictly_reset_student_roles_and_fix_admin.sql','20261007073444_admin_management_persistence.sql']) {
    if(file==='018_admin_v2_architecture.sql')
      await db.exec('ALTER TABLE subscription_plans ADD COLUMN name text; ALTER TABLE subscription_plans ADD COLUMN currency text DEFAULT $$INR$$;');
    const sql=(await readFile(`supabase/migrations/${file}`,'utf8'))
      .replace(/CREATE EXTENSION IF NOT EXISTS "(?:pgcrypto|uuid-ossp)";/g,'');
    await db.exec(sql);
  }
  await db.exec(`SET request.jwt.claim.role='service_role';`);
  const accounts = [
    [1,'admin@practicekoro.online',true],
    [2,'legit@example.test',true],[3,'attacker@example.test',true],
    [4,'unconfirmed@example.test',false],[5,'inactive@example.test',true],
    [6,'support@example.test',true],[7,'forged-primary@example.test',true],
    [8,'ambiguous@example.test',true],[9,'ambiguous@example.test',true],
    [10,'banned@example.test',true],[11,'rename@example.test',true],
  ];
  for (const [n,email,verified] of accounts)
    await db.query(`INSERT INTO auth.users(id,email,email_confirmed_at)
      VALUES($1,$2,CASE WHEN $3 THEN now() ELSE null END)`,[id(n),email,verified]);
  for(const n of [1,6]) {
    await db.query(`INSERT INTO user_roles(user_id,role) VALUES($1,'admin') ON CONFLICT DO NOTHING`,[id(n)]);
    await db.query(`UPDATE profiles SET role='admin',admin_role=$2 WHERE id=$1`,
      [id(n),n===1?'super_admin':'support_agent']);
  }
  await db.query(`UPDATE profiles SET account_status='inactive' WHERE id=$1`,[id(5)]);
  await db.query(`UPDATE auth.users SET banned_until=now()+interval '1 day' WHERE id=$1`,[id(10)]);
  // Simulate pre-existing forged duplicates without changing roles.
  await db.query('UPDATE profiles SET email=$2 WHERE id=$1',[id(3),'legit@example.test']);
  await db.query('UPDATE profiles SET email=$2 WHERE id=$1',[id(7),'admin@practicekoro.online']);
  const before=(await db.query('SELECT * FROM profiles ORDER BY id')).rows;
  await db.exec(await readFile('supabase/migrations/20261010062734_verified_staff_identity.sql','utf8'));
  equal((await db.query('SELECT * FROM profiles ORDER BY id')).rows,before);
  const checks=(await db.query(await readFile('supabase/tests/verified_staff_identity_permissions.sql','utf8')))
    .rows[0].verified_staff_identity_security;
  for (const value of Object.values(checks)) equal(value,true);
  const actor = async (n,role='authenticated') => {
    await db.exec('RESET ROLE');
    await db.query(`SELECT set_config('request.jwt.claim.sub',$1,false),
      set_config('request.jwt.claim.role',$2,false)`,[n?id(n):'',role]);
    if(role==='anon'||role==='authenticated') await db.exec(`SET ROLE ${role}`);
  };
  await db.exec('GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT SELECT,UPDATE ON profiles TO authenticated;');
  const assign = 'SELECT assign_admin_staff_by_email($1,$2) result';
  const update = 'SELECT update_admin_staff_role($1,$2) result';
  for(const n of [3,4,5,6]) {
    await actor(n);
    await rejected(assign,['legit@example.test','content_writer'],/Only active super admins/);
  }
  await actor(null,'anon');
  await rejected(assign,['legit@example.test','content_writer'],/permission denied/);
  await actor(3);
  await rejected('UPDATE profiles SET email=$1 WHERE id=auth.uid()',
    ['another@example.test'],/Profile email must match Auth identity/);
  await db.query('UPDATE profiles SET email=$1 WHERE id=auth.uid()',['attacker@example.test']);
  equal((await db.query('SELECT email FROM profiles WHERE id=auth.uid()')).rows[0].email,'attacker@example.test');
  await db.query(`UPDATE profiles SET full_name='Profile edits still work' WHERE id=auth.uid()`);
  equal((await db.query('SELECT full_name FROM profiles WHERE id=auth.uid()')).rows[0].full_name,
    'Profile edits still work');
  await actor(1);
  const assigned=(await db.query(assign,[' LEGIT@EXAMPLE.TEST ','content_writer'])).rows[0].result;
  equal(assigned.success,true); equal(assigned.member.id,id(2));
  await db.exec('RESET ROLE');
  equal((await db.query('SELECT role FROM profiles WHERE id=$1',[id(3)])).rows[0].role,'student');
  await actor(1);
  for(const email of ['unconfirmed@example.test','banned@example.test','missing@example.test'])
    await rejected(assign,[email,'support_agent'],/No verified registered account/);
  await rejected(assign,['inactive@example.test','support_agent'],/active profile/);
  await rejected(assign,['ambiguous@example.test','content_writer'],/Ambiguous Auth email identity/);
  for(const email of [null,'','x'.repeat(255)])
    await rejected(assign,[email,'content_writer'],/Provide a verified registered account/);
  for(const role of [null,'invalid'])
    await rejected(update,[id(2),role],/Invalid staff role/);
  await rejected(update,[id(7),'super_admin'],/matching the verified Auth identity/);
  await rejected(update,[id(3),'super_admin'],/Only the primary platform account/);
  await rejected(update,[id(1),'support_agent'],/primary Super Admin cannot be demoted/);
  await rejected(update,[id(4),'support_agent'],/verified, non-banned Auth email/);
  await rejected(update,[id(10),'support_agent'],/verified, non-banned Auth email/);
  await rejected(update,[id(999),'support_agent'],/verified, non-banned Auth email/);
  await actor(1,'service_role'); // Fixture owner with trusted service request identity.
  await rejected('UPDATE profiles SET email=$2 WHERE id=$1',[id(3),'fake@example.test'],
    /Profile email must match Auth identity/);
  await rejected('INSERT INTO profiles(id,email,full_name) VALUES($1,$2,$3)',
    [id(999),'fake@example.test','Fake'],/existing Auth identity/);
  await db.query(`UPDATE auth.users SET email_change='pending@example.test' WHERE id=$1`,[id(11)]);
  equal((await db.query('SELECT email FROM profiles WHERE id=$1',[id(11)])).rows[0].email,'rename@example.test');
  await db.query(`UPDATE auth.users SET email='renamed@example.test' WHERE id=$1`,[id(11)]);
  equal((await db.query('SELECT email,role,admin_role FROM profiles WHERE id=$1',[id(11)])).rows[0],
    {email:'renamed@example.test',role:'student',admin_role:null});
  await rejected(`UPDATE auth.users SET email='renamed-primary@example.test' WHERE id=$1`,
    [id(1)],/Only.*Super Admin|violates check constraint/);
  equal((await db.query('SELECT email FROM auth.users WHERE id=$1',[id(1)])).rows[0].email,
    'admin@practicekoro.online');
  await db.query(`INSERT INTO auth.users(id,email) VALUES($1,'new-signup@example.test')`,[id(12)]);
  equal((await db.query('SELECT email,role FROM profiles WHERE id=$1',[id(12)])).rows[0],
    {email:'new-signup@example.test',role:'student'});
  await db.query(`UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1`,[id(4)]);
  await actor(1);
  equal((await db.query(assign,['unconfirmed@example.test','support_agent'])).rows[0].result.success,true);
  await db.exec('RESET ROLE');
  equal((await db.query('SELECT role FROM profiles WHERE id=$1',[id(7)])).rows[0].role,'student');
  console.log(`PASS: ${assertions} staff-identity assertions; Auth lookup, spoof/duplicate denial, verified-account promotion, normal profile/signup/email-change compatibility and primary-admin protection.`);
} finally {
  await db.close();
}