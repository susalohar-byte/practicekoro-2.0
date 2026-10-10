// Disposable metadata fixture only; no actual storage uploads or production access.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
let checks=0;
const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,
      name text NOT NULL,owner uuid,owner_id text,UNIQUE(bucket_id,name));
    CREATE TABLE storage.buckets(id text PRIMARY KEY,public boolean);
    INSERT INTO storage.buckets VALUES('avatars',true);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA storage,auth TO anon,authenticated,service_role;
    GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated,service_role;
    CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects FOR SELECT USING(bucket_id='avatars');
    CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT
      TO authenticated WITH CHECK(bucket_id='avatars');
    CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE
      TO authenticated USING(bucket_id='avatars');
    -- Deliberately broad fixture policy verifies restrictive guards cannot be OR-bypassed.
    CREATE POLICY other_policy ON storage.objects FOR ALL USING(true) WITH CHECK(true);
  `);
  await db.query(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('avatars',$1,$2)`,
    [`avatars/${id(2)}-123.png`,id(2)]);
  const before=(await db.query('SELECT * FROM storage.objects')).rows;
  await db.exec(await readFile('supabase/migrations/20261010063931_avatar_owner_enforcement.sql','utf8'));
  equal((await db.query('SELECT * FROM storage.objects')).rows,before);
  const metadataChecks=(await db.query(await readFile('supabase/tests/avatar_owner_permissions.sql','utf8')))
    .rows[0].avatar_ownership_security;
  for(const value of Object.values(metadataChecks)) equal(value,true);
  await db.query(`SELECT set_config('request.jwt.claim.sub',$1,false)`,[id(1)]);
  await db.exec('SET ROLE authenticated');
  const rejected=async(sql,params=[])=>{
    await assert.rejects(()=>db.query(sql,params),/row-level security/);checks++;
  };
  await rejected(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('avatars',$1,$2)`,
    [`avatars/${id(2)}-456.png`,id(1)]);
  await rejected(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('avatars',$1,$2)`,
    [`avatars/${id(1)}-456.png`,id(2)]);
  await rejected(`INSERT INTO storage.objects(bucket_id,name) VALUES('avatars',$1)`,[`${id(1)}/no-owner.png`]);
  equal((await db.query(`UPDATE storage.objects SET name='overwritten.png' WHERE owner_id=$1 RETURNING id`,[id(2)])).rows.length,0);
  equal((await db.query(`DELETE FROM storage.objects WHERE owner_id=$1 RETURNING id`,[id(2)])).rows.length,0);
  for(const name of [`avatars/${id(1)}-456.png`,`${id(1)}/self.png`])
    await db.query(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('avatars',$1,$2)`,[name,id(1)]);
  equal((await db.query(`UPDATE storage.objects SET name=$1 WHERE name=$2 RETURNING id`,
    [`${id(1)}/renamed.png`,`${id(1)}/self.png`])).rows.length,1);
  await rejected(`UPDATE storage.objects SET owner_id=$1 WHERE owner_id=$2`,[id(2),id(1)]);
  await rejected(`UPDATE storage.objects SET name=$1 WHERE name=$2`,
    [`${id(2)}/stolen.png`,`${id(1)}/renamed.png`]);
  await db.query(`INSERT INTO storage.objects(bucket_id,name,owner) VALUES('avatars',$1,$2)`,
    [`${id(1)}/legacy-owner.png`,id(1)]);
  equal((await db.query(`UPDATE storage.objects SET name=$1 WHERE name=$2 RETURNING id`,
    [`${id(1)}/legacy-renamed.png`,`${id(1)}/legacy-owner.png`])).rows.length,1);
  await db.query(`INSERT INTO storage.objects(bucket_id,name) VALUES('question-images','unrelated.png')`);
  equal((await db.query(`UPDATE storage.objects SET name='unrelated-renamed.png'
    WHERE bucket_id='question-images' RETURNING id`)).rows.length,1);
  await rejected(`UPDATE storage.objects SET bucket_id='avatars' WHERE bucket_id='question-images'`);
  await db.exec('RESET ROLE; SET request.jwt.claim.sub=\'\'; SET ROLE anon;');
  await rejected(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('avatars',$1,$2)`,
    [`${id(1)}/anonymous.png`,id(1)]);
  equal((await db.query(`SELECT count(*)::int n FROM storage.objects WHERE bucket_id='avatars'`)).rows[0].n,4);
  await db.exec('RESET ROLE; SET ROLE service_role;');
  equal((await db.query(`UPDATE storage.objects SET name=$1 WHERE owner_id=$2 RETURNING id`,
    [`avatars/${id(2)}-server.png`,id(2)])).rows.length,1);
  console.log(`PASS: ${checks} avatar ownership assertions; cross-user denial, owner/path changes, legitimate legacy/current paths, public reads, unrelated buckets and trusted service access.`);
} finally { await db.close(); }