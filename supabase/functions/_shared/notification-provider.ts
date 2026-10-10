export type GatewayResult = {success:boolean;message:string;recipientCount:number;requestId?:string;walletBalance?:number};
export type GatewayInput = {action:'balance'|'sms'|'push';numbers?:string[];message?:string;title?:string;body?:string;topic?:string;actionUrl?:string;deviceTokens?:string[]};
export class GatewayError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status;}}
export function validateGatewayInput(raw:unknown):GatewayInput {
 if(!raw||typeof raw!=='object')throw new GatewayError('Invalid request');
 const x=raw as Record<string,unknown>;
 if(!['balance','sms','push'].includes(String(x.action)))throw new GatewayError('Unknown action');
 for(const key of ['apiKey','serverKey','privateKey','serviceAccount'])if(key in x)throw new GatewayError('Provider credentials must remain server-side');
 if(x.action==='balance')return {action:'balance'};
 if(x.action==='sms'){
  if(!Array.isArray(x.numbers)||x.numbers.length!==1||typeof x.numbers[0]!=='string'||!/^[6-9]\d{9}$/.test(x.numbers[0]))throw new GatewayError('Only an explicitly selected single test recipient is supported; bulk audience delivery is not configured');
  if(typeof x.message!=='string'||!x.message.trim()||x.message.length>480)throw new GatewayError('SMS message must be 1–480 characters');
  return {action:'sms',numbers:x.numbers as string[],message:x.message.trim()};
 }
 if(typeof x.title!=='string'||!x.title.trim()||x.title.length>120||typeof x.body!=='string'||!x.body.trim()||x.body.length>1000)throw new GatewayError('Invalid push title or message');
 const tokens=x.deviceTokens;
 if(tokens!==undefined&&(!Array.isArray(tokens)||tokens.length>1||tokens.some(t=>typeof t!=='string'||!t.trim()||t.length>4096)))throw new GatewayError('Select a single registered test device');
 if(!(Array.isArray(tokens)&&tokens.length===1)&&x.topic!=='all_students')throw new GatewayError('Audience-specific push topics are unavailable until secure membership is verified');
 const actionUrl=typeof x.actionUrl==='string'&&x.actionUrl?x.actionUrl:'https://practicekoro.online/dashboard';
 let url:URL;try{url=new URL(actionUrl);}catch{throw new GatewayError('Invalid action link');}
 if(url.protocol!=='https:'||!['practicekoro.online','www.practicekoro.online'].includes(url.hostname)||url.username||url.password||url.port)throw new GatewayError('Use a PracticeKoro HTTPS action link');
 return {action:'push',title:x.title.trim(),body:x.body.trim(),deviceTokens:Array.isArray(tokens)?tokens as string[]:[],topic:'all_students',actionUrl};
}
export async function callNotificationProvider(input:GatewayInput,secrets:{smsKey?:string;smsEnabled:boolean;pushEnabled:boolean;firebaseProject?:string;getGoogleToken:()=>Promise<string>},http:typeof fetch=fetch):Promise<GatewayResult>{
 if(input.action==='balance'||input.action==='sms'){
  if(!secrets.smsEnabled||!secrets.smsKey)throw new GatewayError('Fast2SMS is not configured server-side; nothing was sent',503);
  const response=await http(input.action==='balance'?'https://www.fast2sms.com/dev/wallet':'https://www.fast2sms.com/dev/bulkV2',{
   method:input.action==='balance'?'GET':'POST',headers:{authorization:secrets.smsKey,'Content-Type':'application/json'},
   ...(input.action==='sms'?{body:JSON.stringify({route:'q',message:input.message,language:'english',flash:0,numbers:input.numbers!.join(',')})}:{}),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new GatewayError('SMS provider rejected the request; no success confirmed',502);
  if(input.action==='balance'){
   if(data?.return===false||!['string','number'].includes(typeof data?.wallet)||(typeof data.wallet==='string'&&!/^\d+(?:\.\d+)?$/.test(data.wallet.trim()))||!Number.isFinite(Number(data.wallet))||Number(data.wallet)<0)throw new GatewayError('Invalid balance response; balance not verified',502);
   return {success:true,recipientCount:0,walletBalance:Number(data.wallet),message:`Verified wallet balance: ₹${Number(data.wallet).toFixed(2)}`};
  }
  if(data?.return!==true||typeof data.request_id!=='string'||!data.request_id.trim())throw new GatewayError('SMS acceptance not confirmed by provider',502);
  return {success:true,recipientCount:1,requestId:data.request_id,message:'SMS accepted by provider; handset delivery is not yet verified'};
 }
 if(!secrets.pushEnabled||!secrets.firebaseProject)throw new GatewayError('FCM HTTP v1 is not configured server-side; nothing was sent',503);
 if(!/^[a-z][a-z0-9-]{4,62}$/.test(secrets.firebaseProject))throw new GatewayError('Invalid Firebase server configuration',503);
 const token=await secrets.getGoogleToken();
 if(!token)throw new GatewayError('Google authorization unavailable',503);
 const message={...(input.deviceTokens?.length?{token:input.deviceTokens[0]}:{topic:input.topic}),notification:{title:input.title,body:input.body},data:{click_url:input.actionUrl!}};
 const response=await http(`https://fcm.googleapis.com/v1/projects/${secrets.firebaseProject}/messages:send`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({message}),signal:AbortSignal.timeout(15000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok||typeof data?.name!=='string'||(!data.name.startsWith(`projects/${secrets.firebaseProject}/messages/`)||!data.name.slice(`projects/${secrets.firebaseProject}/messages/`.length).trim()))throw new GatewayError('Push acceptance not confirmed by provider',502);
 return {success:true,recipientCount:input.deviceTokens?.length||0,requestId:data.name,message:'Push accepted by FCM; device delivery and audience count are not verified'};
}
