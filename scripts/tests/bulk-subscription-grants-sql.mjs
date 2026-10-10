// Disposable PostgreSQL fixture only: never grants real subscriptions.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let assertions = 0;
const equal = (a,b) => { assert.deepEqual(a,b); assertions++; };
const count = async () => (await db.query('SELECT count(*)::int n FROM subscriptions')).rows[0].n;
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const migrationPath = 'supabase/migrations/20261010060535_super_admin_bulk_subscription_grants.sql';
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE TABLE profiles(id uuid primary key,role text,admin_role text,account_status text);
    CREATE TABLE subscription_plans(id text primary key,is_active boolean,duration_days integer);
    CREATE TABLE subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid REFERENCES profiles(id),
      plan_id text REFERENCES subscription_plans(id),status text,starts_at timestamptz,expires_at timestamptz);
    CREATE FUNCTION public.is_management_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
      SET search_path=public,pg_temp AS $$
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()
        AND role = 'admin' AND admin_role = 'super_admin' AND account_status = 'active')
    $$;
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    INSERT INTO subscription_plans VALUES('active',true,30),('inactive',false,30),
      ('zero',true,0),('negative',true,-1),('unknown_duration',true,null);
  `);
  const personas = [
    [1,'admin','super_admin','active'],
    [2,'admin','content_writer','active'],
    [3,'admin','support_agent','active'],
    [4,'admin','super_admin','inactive'],
    [5,'student',null,'active'],
    [6,'student',null,'inactive'],
    [7,'admin',null,'active'],
    [8,'student','super_admin','active'],
    [9,'instructor',null,'active'],
    [10,'student',null,'active'],
  ];
  for (const [n,role,subrole,status] of personas)
    await db.query('INSERT INTO profiles VALUES($1,$2,$3,$4)',[id(n),role,subrole,status]);
  for (let n=100;n<200;n++)
    await db.query('INSERT INTO profiles VALUES($1,$2,$3,$4)',[id(n),'student',null,'active']);
  await db.query(`INSERT INTO subscriptions(user_id,plan_id,status,starts_at,expires_at)
    VALUES($1,'active','expired',now()-interval '60 days',now()-interval '30 days')`,[id(5)]);
  const history = (await db.query('SELECT * FROM subscriptions')).rows;
  const migration = await readFile(migrationPath,'utf8');
  await db.exec(migration);
  equal((await db.query('SELECT * FROM subscriptions')).rows,history);
  const checks=(await db.query(await readFile('supabase/tests/bulk_subscription_grant_permissions.sql','utf8')))
    .rows[0].bulk_grant_security;
  for (const value of Object.values(checks)) equal(value,true);

  const actor = async (n,role='authenticated') => {
    await db.exec('RESET ROLE');
    await db.query(`SELECT set_config('request.jwt.claim.sub',$1,false)`,[n?id(n):'']);
    await db.exec(`SET ROLE ${role}`);
  };
  const call = (ids=[id(5)],plan='active',days=30) => db.query(
    'SELECT bulk_grant_student_subscription($1::uuid[],$2,$3) result',[ids,plan,days]);
  const reject = async (ids,plan,days,pattern) => {
    const before = await countAsOwner();
    await assert.rejects(() => call(ids,plan,days),pattern);
    assertions++;
    equal(await countAsOwner(),before);
  };
  const countAsOwner = async () => {
    // Read the fixture using its owner without changing request identity.
    const current=(await db.query('SELECT current_user role')).rows[0].role;
    await db.exec('RESET ROLE');
    const n=await count();
    if(current!=='postgres') await db.exec(`SET ROLE ${current}`);
    return n;
  };
  for (const n of [2,3,4,5,6,7,8,9,999]) {
    await actor(n);
    await reject([id(5)],'active',30,/Active Super Admin/);
  }
  await actor(null);
  await reject([id(5)],'active',30,/Active Super Admin/);
  for (const role of ['anon','service_role']) {
    await actor(1,role);
    await reject([id(5)],'active',30,/permission denied/);
  }
  await actor(1);
  for (const ids of [null,[],[null],[id(5),id(5)],[[id(5),id(10)]],
    Array.from({length:101},(_,i)=>id(i+100))])
    await reject(ids,'active',30,/roster|non-null and unique/);
  for (const plan of [null,'missing','inactive','zero','negative','unknown_duration'])
    await reject([id(5)],plan,30,/active plan/);
  for (const days of [null,0,-1,31,2147483647])
    await reject([id(5)],'active',days,/Grant duration/);
  for (const target of [1,2,3,4,6,9,999])
    await reject([id(5),id(target)],'active',30,/existing active student/);

  equal((await call([id(5),id(10)],'active',30)).rows[0].result,2);
  equal((await call([id(5)],'active',1)).rows[0].result,1);
  await db.exec('RESET ROLE');
  equal(await count(),4);
  const original=(await db.query('SELECT * FROM subscriptions WHERE id=$1',[history[0].id])).rows;
  equal(original,history);
  equal((await db.query(`SELECT bool_and(expires_at-starts_at IN (interval '1 day',interval '30 days')) ok
    FROM subscriptions WHERE status='active'`)).rows[0].ok,true);
  await actor(1);
  equal((await call(Array.from({length:100},(_,i)=>id(i+100)))).rows[0].result,100);
  await db.exec('RESET ROLE');
  // Same session must lose authorization immediately after its live profile is revoked.
  await db.query(`UPDATE profiles SET admin_role='support_agent' WHERE id=$1`,[id(1)]);
  await actor(1);
  await reject([id(5)],'active',30,/Active Super Admin/);
  await db.exec('RESET ROLE');
  await db.exec(migration);
  equal(await count(),104);
  const grants=(await db.query(`SELECT
    has_function_privilege('authenticated','bulk_grant_student_subscription(uuid[],text,integer)','EXECUTE') auth,
    has_function_privilege('anon','bulk_grant_student_subscription(uuid[],text,integer)','EXECUTE') anon,
    has_function_privilege('service_role','bulk_grant_student_subscription(uuid[],text,integer)','EXECUTE') service`)).rows[0];
  equal(grants,{auth:true,anon:false,service:false});
  console.log(`PASS: ${assertions} bulk-grant assertions; role denial, roster/plan/duration validation, atomic failure, valid Super Admin grants and preserved history.`);
} finally {
  await db.close();
}