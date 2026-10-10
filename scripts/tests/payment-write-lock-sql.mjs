// Disposable PostgreSQL fixture; no network, credentials or production records.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
const denied = async (sql) => {
  await assert.rejects(() => db.query(sql), /permission denied|trusted server payment workflow/);
  assertions++;
};
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role',true)
    $$;
    CREATE FUNCTION public.has_role(id uuid, requested text) RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT requested='admin' AND current_setting('fixture.admin',true)='true'
    $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    CREATE TABLE subscription_plans(id text primary key,title text,price numeric,duration_days integer);
    CREATE TABLE payments(id uuid primary key default gen_random_uuid(),user_id uuid,plan_id text,
      order_id text,razorpay_order_id text,status text,amount numeric,currency text,
      created_at timestamptz default now(),razorpay_payment_id text,transaction_id text,
      razorpay_signature text,raw_response jsonb);
    CREATE TABLE subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid,
      plan_id text,payment_id uuid,status text,starts_at timestamptz,expires_at timestamptz,updated_at timestamptz);
    INSERT INTO subscription_plans VALUES('pro','Pro',100,30);
    INSERT INTO payments(id,user_id,plan_id,order_id,razorpay_order_id,status,amount,currency) VALUES
      ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','pro','order_1','order_1','pending',100,'INR'),
      ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','pro','order_2','order_2','pending',100,'INR');
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users read own payments" ON payments FOR SELECT
      USING(auth.uid()=user_id OR has_role(auth.uid(),'admin'));
    CREATE POLICY "Admin manage payments" ON payments FOR ALL
      USING(has_role(auth.uid(),'admin'));
    GRANT ALL ON payments TO anon,authenticated,service_role;
    -- Also exercise explicit column-level grants, even though none were present live.
    GRANT UPDATE(amount), INSERT(status), REFERENCES(id) ON payments TO authenticated;
    CREATE FUNCTION verify_razorpay_payment(text,text,text,text) RETURNS jsonb LANGUAGE sql AS $$
      SELECT '{}'::jsonb
    $$;
    -- Representative legacy definer writers: prove grants and the trigger both close them.
    CREATE FUNCTION create_razorpay_order(text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN INSERT INTO payments(user_id,amount,status) VALUES(auth.uid(),0,'pending');
      RETURN '{}'::jsonb; END;
    $$;
    CREATE FUNCTION mark_payment_refunded(uuid,numeric,text,text) RETURNS boolean
      LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN UPDATE payments SET status='refunded' WHERE id=$1; RETURN true; END;
    $$;
    GRANT EXECUTE ON FUNCTION create_razorpay_order(text),
      mark_payment_refunded(uuid,numeric,text,text) TO service_role;
    CREATE FUNCTION reconcile_razorpay_webhook(text,text,numeric,text,text) RETURNS jsonb
      LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
    CREATE FUNCTION reconcile_razorpay_refund(text,text,numeric,text) RETURNS jsonb
      LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
  `);
  await db.exec(await readFile('supabase/migrations/20261010031832_service_only_payment_activation.sql','utf8'));
  const before = (await db.query('SELECT * FROM payments ORDER BY id')).rows;
  const migration = await readFile('supabase/migrations/20261010055334_service_only_payment_writes.sql','utf8');
  await db.exec(migration);
  equal((await db.query('SELECT * FROM payments ORDER BY id')).rows, before);
  const checks = (await db.query(await readFile('supabase/tests/payment_write_permissions.sql','utf8')))
    .rows[0].payment_write_security;
  for (const value of Object.values(checks)) equal(value, true);

  const personas = [
    ['anon','',false,0],
    ['student','20000000-0000-0000-0000-000000000001',false,1],
    ['other_student','20000000-0000-0000-0000-000000000002',false,1],
    ['super_admin','20000000-0000-0000-0000-000000000003',true,2],
    ['content_writer','20000000-0000-0000-0000-000000000004',true,2],
    ['support_agent','20000000-0000-0000-0000-000000000005',true,2],
    ['inactive_admin','20000000-0000-0000-0000-000000000006',false,0],
  ];
  for (const [name,id,admin,visible] of personas) {
    const role = name==='anon'?'anon':'authenticated';
    await db.query(`SELECT set_config('request.jwt.claim.sub',$1,false),
      set_config('request.jwt.claim.role',$2,false),set_config('fixture.admin',$3,false)`,
      [id,role,String(admin)]);
    await db.exec(`SET ROLE ${role}`);
    equal((await db.query('SELECT count(*)::int n FROM payments')).rows[0].n,visible);
    await denied(`INSERT INTO payments(user_id,amount,status) VALUES(auth.uid(),1,'completed')`);
    await denied(`UPDATE payments SET amount=1`);
    await denied(`DELETE FROM payments`);
    await denied(`TRUNCATE payments`);
    await denied(`SELECT create_razorpay_order('pro')`);
    await denied(`SELECT mark_payment_refunded('10000000-0000-0000-0000-000000000001',100,'fake','fake')`);
    await db.exec('RESET ROLE');
  }

  // Accidental future grants must not reopen the RLS/definer paths.
  await db.exec(`GRANT INSERT,UPDATE,DELETE ON payments TO authenticated;
    GRANT EXECUTE ON FUNCTION create_razorpay_order(text),
      mark_payment_refunded(uuid,numeric,text,text) TO authenticated;
    SET request.jwt.claim.role='authenticated'; SET fixture.admin='true'; SET ROLE authenticated;`);
  await denied(`INSERT INTO payments(user_id,amount,status) VALUES(auth.uid(),1,'completed')`);
  equal((await db.query(`UPDATE payments SET amount=1 RETURNING id`)).rows.length,0);
  equal((await db.query(`DELETE FROM payments RETURNING id`)).rows.length,0);
  await denied(`SELECT create_razorpay_order('pro')`);
  await denied(`SELECT mark_payment_refunded('10000000-0000-0000-0000-000000000001',100,'fake','fake')`);
  await db.exec('RESET ROLE');
  equal((await db.query('SELECT * FROM payments ORDER BY id')).rows,before);

  // Actual activation implementation still works with the payment trigger installed.
  await db.exec(`SET request.jwt.claim.role='service_role'; SET ROLE service_role;`);
  const call = () => db.query(`SELECT activate_verified_razorpay_payment(
    '20000000-0000-0000-0000-000000000001','order_1','pay_1','server-verified','pro') result`);
  equal((await call()).rows[0].result.success,true);
  equal((await call()).rows[0].result.is_duplicate,true);
  await db.exec(`INSERT INTO payments(user_id,amount,status) VALUES(null,1,'pending');
    UPDATE payments SET status='refunded' WHERE user_id IS NULL;
    DELETE FROM payments WHERE user_id IS NULL; RESET ROLE;`);
  equal((await db.query(`SELECT status,amount FROM payments WHERE order_id='order_1'`)).rows[0],
    {status:'completed',amount:'100'});
  equal((await db.query('SELECT count(*)::int n FROM subscriptions')).rows[0].n,1);
  console.log(`PASS: ${assertions} payment-write assertions; client denial, ownership/reporting, column ACLs, definer bypass guard, service activation/idempotency and unchanged migration data.`);
} finally {
  await db.close();
}