// Isolated PostgreSQL: actual restored production function bodies + fixed paths.
import { readFile } from 'node:fs/promises';import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');const db=new PGlite();let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 await db.exec(`CREATE SCHEMA auth;CREATE SCHEMA storage;CREATE SCHEMA attacker;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
 CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE FUNCTION public.has_active_subscription(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
 CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,email text,district text,role text,admin_role text,updated_at timestamptz);
 CREATE TABLE user_roles(user_id uuid,role text,UNIQUE(user_id,role));CREATE TABLE tests(id text,is_premium boolean);
 CREATE TABLE questions(id text,topic_id text,chapter_id text);
 CREATE TABLE storage.buckets(id text PRIMARY KEY,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 INSERT INTO storage.buckets VALUES('avatars',true,NULL,NULL),('question-images',true,5242880,ARRAY['image/png','image/svg+xml']),('banners',true,10485760,ARRAY['image/svg+xml','image/png']);
 `);
 const before=JSON.parse(await readFile('supabase/tests/fixtures/function_search_path_baseline.json','utf8'));
 for(const f of before.mutable_functions)await db.exec(f.definition);
 const defs=(await db.query(`SELECT oid::regprocedure::text signature,prosrc,proacl,prosecdef FROM pg_proc WHERE pronamespace='public'::regnamespace ORDER BY oid`)).rows;
 for(const f of ['20261010074118_upload_and_function_hardening.sql','20261010074504_image_upload_limits_service_policy.sql'])await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
 const after=(await db.query(`SELECT oid::regprocedure::text signature,prosrc,proacl,prosecdef FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname<>'take_image_upload_slot' ORDER BY oid`)).rows;eq(after,defs);
 eq((await db.query(`SELECT count(*)::int n FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname=ANY($1) AND proconfig @> ARRAY['search_path=pg_catalog, public, pg_temp']`,[before.mutable_functions.map(f=>f.name)])).rows[0].n,6);
 const buckets=(await db.query(`SELECT * FROM storage.buckets ORDER BY id`)).rows;eq(buckets.every(b=>b.public),true);eq(buckets.every(b=>!b.allowed_mime_types.includes('image/svg+xml')),true);eq(buckets.find(b=>b.id==='avatars').file_size_limit,2097152);
 // Hostile caller path must not redirect signup writes to attacker's tables.
 await db.exec(`CREATE TABLE attacker.profiles(id uuid);SET search_path=attacker,public;
 CREATE TRIGGER signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 CREATE TRIGGER updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
 CREATE TRIGGER topic BEFORE INSERT ON public.questions FOR EACH ROW EXECUTE FUNCTION public.sync_question_topic_chapter();
 INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','fixture@example.test','{"full_name":"Fixture"}');
 INSERT INTO public.tests VALUES('free',false),('premium',true);
 INSERT INTO public.questions VALUES('q','chapter',NULL);`);
 eq((await db.query('SELECT count(*)::int n FROM public.profiles')).rows[0].n,1);eq((await db.query('SELECT count(*)::int n FROM attacker.profiles')).rows[0].n,0);
 eq((await db.query('SELECT chapter_id FROM public.questions')).rows[0].chapter_id,'chapter');
 eq((await db.query(`SELECT public.has_test_access('00000000-0000-0000-0000-000000000001','free') b`)).rows[0].b,true);
 eq((await db.query(`SELECT public.has_test_access('00000000-0000-0000-0000-000000000001','premium') b`)).rows[0].b,false);
 await db.exec(`SET request.jwt.claim.role='service_role';`);
 for(let n=0;n<10;n++)eq((await db.query(`SELECT public.take_image_upload_slot('00000000-0000-0000-0000-000000000001') b`)).rows[0].b,true);
 eq((await db.query(`SELECT public.take_image_upload_slot('00000000-0000-0000-0000-000000000001') b`)).rows[0].b,false);
 await db.exec(`UPDATE public.image_upload_limits SET window_start=now()-interval '2 minutes';`);
 eq((await db.query(`SELECT public.take_image_upload_slot('00000000-0000-0000-0000-000000000001') b`)).rows[0].b,true);
 for(const role of ['anon','authenticated']){eq((await db.query(`SELECT has_function_privilege($1,'public.take_image_upload_slot(uuid)','EXECUTE') b`,[role])).rows[0].b,false);}
 await db.exec(`SET request.jwt.claim.role='authenticated';`);await assert.rejects(()=>db.query(`SELECT public.take_image_upload_slot('00000000-0000-0000-0000-000000000001')`),/Service access/);checks++;
 console.log(`PASS: ${checks} path/storage/rate-limit PostgreSQL assertions; function bodies/ACLs unchanged, hostile caller paths, signup/access/topic compatibility and upload throttling.`);
}finally{await db.close();}
