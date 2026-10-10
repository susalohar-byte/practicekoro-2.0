import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');const db=new PGlite();let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 await db.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('request.jwt.claim.role',true)$$;CREATE TABLE public.app_settings(id text PRIMARY KEY,value jsonb);INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001');SET request.jwt.claim.role='service_role';`);
 await db.exec(await readFile(process.env.NOTIFICATION_MIGRATION||'supabase/migrations/20261010093512_notification_gateway_security.sql','utf8'));
 for(const id of ['gateway_fast2sms_api_key','gateway_fcm_server_key']){await assert.rejects(()=>db.query('INSERT INTO app_settings VALUES($1,$2)',[id,'"fixture"']));checks++;}
 await db.exec(`INSERT INTO app_settings VALUES('gateway_fast2sms_enabled','true');`);eq((await db.query('SELECT count(*)::int n FROM app_settings')).rows[0].n,1);
 const actor='00000000-0000-0000-0000-000000000001';
 for(let n=1;n<=5;n++)eq((await db.query('SELECT public.start_notification_gateway_request($1,$2,$3) b',[actor,`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,'balance'])).rows[0].b,true);
 eq((await db.query('SELECT public.start_notification_gateway_request($1,$2,$3) b',[actor,'00000000-0000-4000-8000-000000000006','sms'])).rows[0].b,false);
 await db.exec(`UPDATE notification_gateway_requests SET created_at=now()-interval '2 minutes';`);
 eq((await db.query('SELECT public.start_notification_gateway_request($1,$2,$3) b',[actor,'00000000-0000-4000-8000-000000000001','sms'])).rows[0].b,false);
 for(const role of ['anon','authenticated']){eq((await db.query("SELECT has_function_privilege($1,'public.start_notification_gateway_request(uuid,uuid,text)','EXECUTE') b",[role])).rows[0].b,false);eq((await db.query("SELECT has_table_privilege($1,'public.notification_gateway_requests','SELECT') b",[role])).rows[0].b,false);}
 await db.exec(`SET request.jwt.claim.role='authenticated';`);await assert.rejects(()=>db.query('SELECT public.start_notification_gateway_request($1,$2,$3)',[actor,'00000000-0000-4000-8000-000000000007','sms']),/Service access/);checks++;
 console.log(`PASS: ${checks} notification credential/rate/idempotency SQL assertions.`);
}finally{await db.close();}
