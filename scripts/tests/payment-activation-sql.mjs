// Disposable PostgreSQL fixture. No production/network access.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE FUNCTION public.verify_razorpay_payment(p_order_id text,p_payment_id text,p_signature text,p_plan_id text)
RETURNS jsonb LANGUAGE sql AS $$ SELECT '{"success":true}'::jsonb $$;
GRANT EXECUTE ON FUNCTION public.verify_razorpay_payment(text,text,text,text) TO authenticated,service_role;
CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
CREATE TABLE subscription_plans(id text primary key,title text,price numeric,duration_days integer);
CREATE TABLE payments(id uuid primary key,user_id uuid,plan_id text,order_id text,razorpay_order_id text,
 status text,amount numeric,currency text,created_at timestamptz default now(),razorpay_payment_id text,
 transaction_id text,razorpay_signature text,raw_response jsonb);
CREATE TABLE subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid,plan_id text,payment_id uuid,
 status text,starts_at timestamptz,expires_at timestamptz,updated_at timestamptz);
INSERT INTO subscription_plans VALUES('pro','Pro',100,30);
INSERT INTO payments(id,user_id,plan_id,order_id,razorpay_order_id,status,amount,currency) VALUES
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','pro','order_1','order_1','pending',100,'INR'),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','pro','order_2','order_2','pending',100,'INR');
`);
const sql = await readFile(
  'supabase/migrations/20261010031832_service_only_payment_activation.sql',
  'utf8'
);
await db.exec(sql);
const call = (
  order = 'order_1',
  payment = 'pay_1',
  user = '20000000-0000-0000-0000-000000000001',
  signature = 'verified',
  plan = 'pro'
) =>
  db.query(`SELECT activate_verified_razorpay_payment($1::uuid,$2,$3,$4,$5) AS result`, [
    user,
    order,
    payment,
    signature,
    plan,
  ]);
assert.equal(
  (
    await db.query(
      `SELECT has_function_privilege('authenticated','public.activate_verified_razorpay_payment(uuid,text,text,text,text)','EXECUTE') AS allowed`
    )
  ).rows[0].allowed,
  false
);
assert.equal(
  (
    await db.query(
      `SELECT has_function_privilege('anon','public.activate_verified_razorpay_payment(uuid,text,text,text,text)','EXECUTE') AS allowed`
    )
  ).rows[0].allowed,
  false
);
assert.equal(
  (
    await db.query(
      `SELECT has_function_privilege('authenticated','public.verify_razorpay_payment(text,text,text,text)','EXECUTE') AS allowed`
    )
  ).rows[0].allowed,
  false
);
await db.exec(`SET request.jwt.claim.role = 'authenticated';`);
await assert.rejects(call(), /Service role required/);
await assert.rejects(
  () => db.query(`SELECT verify_razorpay_payment('order_1','pay_1','fake','pro')`),
  /authenticated verify-payment endpoint/
);
await db.exec(`SET request.jwt.claim.role = 'service_role';`);
await assert.rejects(() => call('unknown'), /not found/);
await assert.rejects(
  () => call('order_1', 'pay_1', '20000000-0000-0000-0000-000000000099'),
  /not found/
);
await assert.rejects(() => call('order_1', 'pay_1', undefined, ''), /signature is required/);
await assert.rejects(() => call('order_1', 'pay_1', undefined, undefined, 'wrong'), /Mismatched/);
const first = (await call()).rows[0].result;
assert.equal(first.success, true);
assert.equal(first.status, 'active');
const before = (await db.query('SELECT expires_at FROM subscriptions')).rows[0].expires_at;
assert.equal((await call()).rows[0].result.is_duplicate, true);
assert.equal(
  String((await db.query('SELECT expires_at FROM subscriptions')).rows[0].expires_at),
  String(before)
);
await assert.rejects(() => call('order_1', 'other_pay'), /mismatch/);
await assert.rejects(() => call('order_2', 'pay_1'), /Duplicate payment/);
const renewal = (await call('order_2', 'pay_2')).rows[0].result;
assert.equal(renewal.is_renewal, true);
assert.equal((await db.query('SELECT count(*)::int n FROM subscriptions')).rows[0].n, 1);
assert.equal(
  (await db.query(`SELECT extract(day FROM expires_at-starts_at)::int n FROM subscriptions`))
    .rows[0].n,
  60
);
await db.exec(`UPDATE payments SET status='refunded' WHERE order_id='order_2'`);
await assert.rejects(() => call('order_2', 'pay_2'), /not eligible/);
await db.exec(`UPDATE payments SET status='pending',amount=1 WHERE order_id='order_2'`);
await assert.rejects(() => call('order_2', 'pay_3'), /amount or currency/);
assert.equal(
  (await db.query(`SELECT status FROM payments WHERE order_id='order_2'`)).rows[0].status,
  'pending'
);
await db.exec(sql); // Reapply does not reopen permissions or mutate history.
await db.close();
console.log(
  'PASS: 18 activation SQL assertions: permissions, ownership, no pending fallback, validation, idempotency, renewal and rollback.'
);
