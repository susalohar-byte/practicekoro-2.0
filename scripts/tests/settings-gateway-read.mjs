// Isolated fixtures, no production database access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE profiles(id uuid,role text,account_status text);
    CREATE TABLE payment_gateways(gateway text,key_id text,is_active boolean,updated_at timestamptz,key_secret text,webhook_secret text);
    CREATE TABLE app_settings(id text,value jsonb);
    INSERT INTO profiles VALUES ('00000000-0000-0000-0000-000000000001','admin','active'),('00000000-0000-0000-0000-000000000002','admin','inactive'),('00000000-0000-0000-0000-000000000003','student','active');
    INSERT INTO payment_gateways VALUES('razorpay','rzp_test_fixture',false,now(),'secret-fixture','webhook-fixture');`);
  await db.exec(
    fs.readFileSync('supabase/migrations/20261010041322_settings_gateway_read_guard.sql', 'utf8')
  );
  for (const id of [
    '',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
  ]) {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
    await assert.rejects(db.query('SELECT admin_get_payment_gateway()'), /Active Admin/);
  }
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    '00000000-0000-0000-0000-000000000001',
  ]);
  let r = (await db.query('SELECT admin_get_payment_gateway() AS value')).rows[0].value;
  assert.equal(r.is_active, false);
  assert.equal(r.key_id, 'rzp_test_fixture');
  assert.equal(r.secret_preview, null);
  assert.equal(r.webhook_preview, null);
  assert.equal(JSON.stringify(r).includes('secret-fixture'), false);
  await db.exec('DELETE FROM payment_gateways;');
  r = (await db.query('SELECT admin_get_payment_gateway() AS value')).rows[0].value;
  assert.equal(r.is_active, false);
  assert.equal(r.key_id, '');
  assert.equal(
    (
      await db.query(
        "SELECT has_function_privilege('anon','public.admin_get_payment_gateway(text)','EXECUTE') AS allowed"
      )
    ).rows[0].allowed,
    false
  );
  console.log(
    'PASS: active-admin read, inactive/student/anonymous denial, secret-fragment suppression, missing gateway disabled, anon execute revoked.'
  );
} finally {
  await db.close();
}
