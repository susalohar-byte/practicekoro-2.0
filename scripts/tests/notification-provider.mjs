/* global Response */
import assert from 'node:assert/strict';
import {validateGatewayInput,callNotificationProvider} from '../../supabase/functions/_shared/notification-provider.ts';
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const sms={action:'sms',numbers:['9876543210'],message:'Fixture only'};
for(const input of [{},null,{...sms,apiKey:'test-only-secret'},{...sms,numbers:[]},{...sms,numbers:['9876543210','9876543211']},{...sms,message:''},{...sms,message:'x'.repeat(481)},{action:'push',title:'t',body:'b',topic:'pro_students'},{action:'push',title:'t',body:'b',topic:'all_students',actionUrl:'https://evil.test'},{action:'push',title:'t',body:'b',deviceTokens:['x','y']}]){assert.throws(()=>validateGatewayInput(input));checks++;}
const validated=validateGatewayInput(sms);eq(validated.numbers,['9876543210']);
const secrets={smsEnabled:true,smsKey:'server-only-test-key',pushEnabled:true,firebaseProject:'fixture-project',getGoogleToken:async()=>'server-only-google-token'};
let calls=0;
await assert.rejects(()=>callNotificationProvider(validated,{...secrets,smsKey:undefined},async()=>{calls++;}),/not configured/);checks++;eq(calls,0);
await assert.rejects(()=>callNotificationProvider(validated,secrets,async()=>{throw new TypeError('Failed to fetch');}));checks++;
await assert.rejects(()=>callNotificationProvider(validated,secrets,async()=>new Response('{}',{status:403})),/rejected/);checks++;
await assert.rejects(()=>callNotificationProvider(validated,secrets,async()=>new Response('{"return":true}')),/not confirmed/);checks++;
const result=await callNotificationProvider(validated,secrets,async(url,opts)=>{eq(url,'https://www.fast2sms.com/dev/bulkV2');eq(opts.headers.authorization,'server-only-test-key');eq(JSON.parse(opts.body).numbers,'9876543210');return new Response('{"return":true,"request_id":"provider-fixture"}');});
eq(result.success,true);eq(result.recipientCount,1);eq('isSimulated' in result,false);eq(result.message.includes('not yet verified'),true);
for(const wallet of [null,'',-1,'not-a-number',false,[],{}]){await assert.rejects(()=>callNotificationProvider({action:'balance'},secrets,async()=>new Response(JSON.stringify({wallet}))));checks++;}
await assert.rejects(()=>callNotificationProvider({action:'balance'},secrets,async()=>new Response('{"return":false,"wallet":0}')));checks++;
eq((await callNotificationProvider({action:'balance'},secrets,async()=>new Response('{"wallet":0}'))).walletBalance,0);
const push=validateGatewayInput({action:'push',title:'test',body:'test',topic:'all_students'});
const accepted=await callNotificationProvider(push,secrets,async(url,opts)=>{eq(url,'https://fcm.googleapis.com/v1/projects/fixture-project/messages:send');eq(opts.headers.Authorization,'Bearer server-only-google-token');eq(JSON.parse(opts.body).message.topic,'all_students');return new Response('{"name":"projects/fixture-project/messages/fixture"}');});
eq(accepted.recipientCount,0);eq(accepted.success,true);
await assert.rejects(()=>callNotificationProvider(push,secrets,async()=>new Response('{"name":"projects/evil-project/messages/fixture"}')));checks++;
await assert.rejects(()=>callNotificationProvider(push,{...secrets,pushEnabled:false},async()=>{calls++;}));checks++;
console.log(`PASS: ${checks} provider validation assertions; no live provider calls or messages.`);
