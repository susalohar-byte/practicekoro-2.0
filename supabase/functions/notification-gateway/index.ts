import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {SignJWT,importPKCS8} from 'npm:jose@5.9.6';
import {validateGatewayInput,callNotificationProvider,GatewayError} from '../_shared/notification-provider.ts';
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin');const origins=['https://practicekoro.online','https://www.practicekoro.online'];
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
 if(origin&&origins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
 const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 const fail=(message:string,status:number)=>respond({success:false,message,recipientCount:0},status);
 if(origin&&!origins.includes(origin))return fail('Origin not allowed',403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return fail('Method not allowed',405);
 const token=req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];if(!token)return fail('Authentication required',401);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key||!anon)return fail('Server configuration unavailable',503);
 const service=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await service.auth.getUser(token);if(authError||!auth.user)return fail('Invalid session',401);
 const caller=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
 const {data:allowed,error:scopeError}=await caller.rpc('admin_scope_allowed',{p_scope:'super'});
 if(scopeError||allowed!==true)return fail('Active Super Admin required',403);
 let requestId:string|undefined;
 try{
  const reader=req.body?.getReader();if(!reader)throw new GatewayError('Request body required');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw new GatewayError('Request too large',413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const raw=JSON.parse(new TextDecoder().decode(bytes));const input=validateGatewayInput(raw);
  if(typeof raw.requestId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.requestId))throw new GatewayError('Unique request ID required');
  const {data:slot,error:slotError}=await service.rpc('start_notification_gateway_request',{p_actor:auth.user.id,p_request_id:raw.requestId,p_action:input.action});
  if(slotError)throw new GatewayError('Dispatch protection unavailable',503);
  if(slot!==true)throw new GatewayError('Duplicate request or rate limit reached; do not resend an uncertain dispatch',429);
  requestId=raw.requestId;
  const {data:settings,error:settingError}=await service.from('app_settings').select('id,value').in('id',['gateway_fast2sms_enabled','gateway_fcm_enabled']);
  if(settingError)throw new GatewayError('Gateway settings unavailable',503);
  const enabled=(id:string)=>settings?.some(s=>s.id===id&&(s.value===true||s.value==='true'))===true;
  const result=await callNotificationProvider(input,{smsKey:Deno.env.get('FAST2SMS_API_KEY'),smsEnabled:enabled('gateway_fast2sms_enabled'),pushEnabled:enabled('gateway_fcm_enabled'),firebaseProject:Deno.env.get('FIREBASE_PROJECT_ID'),getGoogleToken:async()=>{
   const secret=Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');if(!secret)throw new GatewayError('Firebase service account is not configured',503);
   let account;try{account=JSON.parse(secret);}catch{throw new GatewayError('Invalid Firebase server configuration',503);}
   if(account.project_id!==Deno.env.get('FIREBASE_PROJECT_ID')||typeof account.client_email!=='string'||typeof account.private_key!=='string')throw new GatewayError('Invalid Firebase server configuration',503);
   const jwt=await new SignJWT({scope:'https://www.googleapis.com/auth/firebase.messaging'}).setProtectedHeader({alg:'RS256'}).setIssuer(account.client_email).setSubject(account.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('5m').sign(await importPKCS8(account.private_key,'RS256'));
   const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt}),signal:AbortSignal.timeout(15000)});
   const data=await r.json().catch(()=>null);if(!r.ok||typeof data?.access_token!=='string')throw new GatewayError('Google authorization failed',502);return data.access_token;
  }});
  const {error:auditError}=await service.from('notification_gateway_requests').update({outcome:'accepted',provider_reference:result.requestId||null}).eq('id',requestId);
  if(auditError)return fail('Provider response received but audit confirmation failed; do not resend blindly',502);
  return respond(result);
 }catch(error){
  if(requestId)await service.from('notification_gateway_requests').update({outcome:'unconfirmed'}).eq('id',requestId);
  // Never reflect provider exceptions/credentials or claim delivery on network timeout.
  return fail(error instanceof GatewayError?error.message:'Dispatch could not be confirmed; check provider history before retrying',error instanceof GatewayError?error.status:502);
 }
});
