// Actual byte decoding in isolation; no upload or production network requests.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { sanitizeRaster, rasterDimensions } from '../../supabase/functions/_shared/raster-validation.ts';
const req=createRequire(process.env.RASTER_DECODER_PACKAGE || import.meta.url);
const {PNG}=req('pngjs'),jpeg=req('jpeg-js');let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const decode=async(bytes,mime)=>mime==='image/png'?PNG.sync.read(Buffer.from(bytes),{checkCRC:true}):jpeg.decode(bytes,{useTArray:true,tolerantDecoding:false,maxResolutionInMP:4,maxMemoryUsageInMB:48});
const encode=async(image)=>new Uint8Array(PNG.sync.write({...image,data:Buffer.from(image.data)}));
const image={width:4,height:3,data:Buffer.alloc(4*3*4,128)};
const png=PNG.sync.write(image),jpg=jpeg.encode(image,80).data;
for(const [bytes,mime] of [[png,'image/png'],[jpg,'image/jpeg']]){
 const safe=await sanitizeRaster(bytes,mime,1024*1024,decode,encode);
 eq(rasterDimensions(safe,'image/png'),{width:4,height:3});
 eq(PNG.sync.read(Buffer.from(safe)).data.length,48);
 const polyglot=Buffer.concat([bytes,Buffer.from('<script>polyglot-marker</script>')]);
 if(mime==='image/png'){await assert.rejects(()=>sanitizeRaster(polyglot,mime,1024*1024,decode,encode));checks++;}
 else {const cleaned=await sanitizeRaster(polyglot,mime,1024*1024,decode,encode);eq(Buffer.from(cleaned).includes(Buffer.from('polyglot-marker')),false);}
}
for(const [bytes,mime,limit] of [[Buffer.from('<svg onload="alert(1)"/>'),'image/png',100], [png,'image/svg+xml',1024], [jpg,'image/png',1024], [png,'image/jpeg',1024], [png,'image/png',2],[new Uint8Array(),'image/png',1024]]){
 await assert.rejects(()=>sanitizeRaster(bytes,mime,limit,decode,encode));checks++;
}
const bomb=Buffer.from(png);bomb.writeUInt32BE(10000,16);let called=false;
await assert.rejects(()=>sanitizeRaster(bomb,'image/png',1024,async()=>{called=true;return image;},encode),/pixel limit/);checks++;eq(called,false);
const corrupt=Buffer.from(png);corrupt[corrupt.length-5]^=1;
await assert.rejects(()=>sanitizeRaster(corrupt,'image/png',1024,decode,encode));checks++;
await assert.rejects(()=>sanitizeRaster(png,'image/png',1024,async()=>({...image,width:5}),encode),/Invalid decoded/);checks++;
console.log(`PASS: ${checks} actual raster-byte validation assertions; PNG/JPEG decoding, content/MIME mismatch, SVG denial, polyglot stripping, CRC/size/pixel bounds.`);
