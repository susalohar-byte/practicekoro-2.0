// Isolated fixture only. The pending migration is NOT applied to a production project.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE public.profiles(id uuid,role text,admin_role text,account_status text);
    CREATE FUNCTION public.is_management_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin' AND admin_role='super_admin' AND account_status='active') $$;
    CREATE TABLE public.payment_gateways(gateway text PRIMARY KEY,key_id text,key_secret text,webhook_secret text,is_active boolean NOT NULL,updated_at timestamptz);
    CREATE TABLE public.app_settings(id text PRIMARY KEY,category text,key text,value jsonb,description text,updated_at timestamptz);
    INSERT INTO public.profiles VALUES('${admin}','admin','super_admin','active'),
      ('00000000-0000-0000-0000-000000000002','admin','content_writer','active'),
      ('00000000-0000-0000-0000-000000000003','admin','super_admin','inactive'),
      ('00000000-0000-0000-0000-000000000004','student',null,'active');
    INSERT INTO public.payment_gateways VALUES('razorpay','rzp_test_old','legacy-secret-fixture','legacy-webhook-fixture',false,now());`);
  await db.exec(
    fs.readFileSync(
      new URL(
        '../../supabase/migrations/20261007164000_admin_settings_gateway_guard.sql',
        import.meta.url
      ),
      'utf8'
    )
  );
  const invoke = (key, secret = null) =>
    db.query("SELECT public.admin_update_payment_gateway('razorpay',$1,$2,NULL,true) AS result", [
      key,
      secret,
    ]);
  for (const id of [
    '',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
  ]) {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
    await assert.rejects(invoke('rzp_test_new'), /Active Super Admin/);
  }
  console.log('PASS null, content-writer, inactive super-admin and student identities denied');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
  const r = (await invoke('rzp_live_confirmed')).rows[0].result;
  assert.equal(r.success, true);
  assert.equal(r.key_id, 'rzp_live_confirmed');
  assert.equal(r.is_active, true);
  const gateway = (await db.query('SELECT * FROM public.payment_gateways')).rows[0];
  assert.equal(gateway.key_secret, 'legacy-secret-fixture');
  assert.equal(gateway.webhook_secret, 'legacy-webhook-fixture');
  assert.equal(
    (
      await db.query(
        "SELECT value FROM public.app_settings WHERE id='payment_gateway_razorpay_key_id'"
      )
    ).rows[0].value,
    'rzp_live_confirmed'
  );
  assert.equal(
    (
      await db.query(
        "SELECT value FROM public.app_settings WHERE id='payment_gateway_razorpay_active'"
      )
    ).rows[0].value,
    true
  );
  assert.equal(r.key_secret, undefined);
  console.log(
    'PASS confirmed public configuration, atomic public-setting synchronization, preserved existing secrets'
  );
  await assert.rejects(invoke('invalid'), /Valid Razorpay/);
  await assert.rejects(invoke('rzp_test_new', 'client-secret-fixture'), /server-side/);
  await db.exec(
    `ALTER TABLE public.app_settings ADD CONSTRAINT fixture_reject CHECK(value<>'"rzp_live_reject"'::jsonb);`
  );
  await assert.rejects(invoke('rzp_live_reject'), /fixture_reject/);
  assert.equal(
    (await db.query('SELECT key_id FROM public.payment_gateways')).rows[0].key_id,
    'rzp_live_confirmed'
  );
  assert.equal(
    (
      await db.query(
        "SELECT value FROM public.app_settings WHERE id='payment_gateway_razorpay_key_id'"
      )
    ).rows[0].value,
    'rzp_live_confirmed'
  );
  const grants = (
    await db.query(
      "SELECT has_function_privilege('anon','public.admin_update_payment_gateway(text,text,text,text,boolean)','EXECUTE') AS anon, has_function_privilege('authenticated','public.admin_update_payment_gateway(text,text,text,text,boolean)','EXECUTE') AS authenticated"
    )
  ).rows[0];
  assert.equal(grants.anon, false);
  assert.equal(grants.authenticated, true);
  console.log(
    'PASS invalid/secret payload rejection, synchronization rollback, anonymous grant denied'
  );
} finally {
  await db.close();
}
