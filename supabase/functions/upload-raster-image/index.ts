import { Buffer } from "node:buffer";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import pngjs from 'npm:pngjs@7.0.0';
import jpeg from 'npm:jpeg-js@0.4.4';
import { sanitizeRaster } from '../_shared/raster-validation.ts';
const limits:Record<string,number>={avatars:2*1024*1024,'question-images':5*1024*1024,banners:10*1024*1024};
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin');
 const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'https://practicekoro.online,https://www.practicekoro.online').split(',').map(x=>x.trim());
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
 if(origin&&allowed.includes(origin))headers['Access-Control-Allow-Origin']=origin;
 const respond=(error:string,status:number)=>new Response(JSON.stringify({success:false,error}),{status,headers});
 if(origin&&!allowed.includes(origin))return respond('Origin not allowed',403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return respond('Method not allowed',405);
 const token=req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return respond('Authentication required',401);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key||!anon)return respond('Server configuration unavailable',503);
 const service=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await service.auth.getUser(token);
 if(authError||!auth.user)return respond('Invalid session',401);
 const {data:profile,error:profileError}=await service.from('profiles').select('account_status').eq('id',auth.user.id).maybeSingle();
 if(profileError||profile?.account_status!=='active')return respond('Active account required',403);
 const {data:slot,error:slotError}=await service.rpc('take_image_upload_slot',{p_user_id:auth.user.id});
 if(slotError)return respond('Upload protection unavailable',503);
 if(!slot)return respond('Too many uploads; retry in one minute',429);
 try{
  // Stream cap also covers chunked requests without Content-Length.
  const maximum=10*1024*1024+65536,reader=req.body?.getReader();
  if(!reader)return respond('Upload body required',400);
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>maximum){await reader.cancel();return respond('Upload too large',413);}chunks.push(value);}
  const body=new Uint8Array(total);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.length;}
  const form=await new Response(body,{headers:{'Content-Type':req.headers.get('Content-Type')||''}}).formData();
  const bucket=form.get('bucket'),file=form.get('file');
  if(typeof bucket!=='string'||!Object.hasOwn(limits,bucket)||!(file instanceof File))return respond('Invalid upload fields',400);
  if(bucket!=='avatars'){
   const caller=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
   const {data:canWrite,error}=await caller.rpc('admin_scope_allowed',{p_scope:'content'});
   if(error||canWrite!==true)return respond('Content management permissions required',403);
  }
  const bytes=new Uint8Array(await file.arrayBuffer());
  const safe=await sanitizeRaster(bytes,file.type,limits[bucket],async(data,mime)=>{
   if(mime==='image/png')return pngjs.PNG.sync.read(Buffer.from(data),{checkCRC:true});
   return jpeg.decode(data,{useTArray:true,tolerantDecoding:false,maxResolutionInMP:4,maxMemoryUsageInMB:48});
  },async(image)=>new Uint8Array(pngjs.PNG.sync.write({...image,data:Buffer.from(image.data)})));
  const path=`${auth.user.id}/${crypto.randomUUID()}.png`;
  const {error}=await service.storage.from(bucket).upload(path,safe,{contentType:'image/png',upsert:false,cacheControl:'3600'});
  if(error)return respond('Durable upload failed',502);
  const publicUrl=service.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return new Response(JSON.stringify({success:true,publicUrl,path}),{headers});
 }catch{return respond('Invalid image; use a valid raster image within the size and pixel limits',400);}
});
