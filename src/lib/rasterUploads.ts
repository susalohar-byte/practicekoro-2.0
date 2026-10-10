import { supabaseRuntime, isSupabaseConfigured } from './supabase';
export type RasterBucket = 'avatars' | 'question-images' | 'banners';
const limits: Record<RasterBucket, number> = { avatars: 2*1024*1024, 'question-images':5*1024*1024, banners:10*1024*1024 };
export function validateRasterFile(file:File,bucket:RasterBucket,maximum=limits[bucket]) {
 const types=bucket==='banners'?['image/png','image/jpeg','image/webp','image/gif']:['image/png','image/jpeg','image/webp'];
 if(!types.includes(file.type) || !file.size || file.size>maximum)
  throw new Error(`Use a non-empty ${bucket==='banners'?'PNG, JPG, WebP or GIF':'PNG, JPG or WebP'} image up to ${maximum/1024/1024} MB. SVG is not supported.`);
}
export async function uploadValidatedImage(file:File,bucket:RasterBucket):Promise<string>{
 validateRasterFile(file,bucket);
 if(!isSupabaseConfigured)throw new Error('Connect to the database before uploading images.');
 // Normalize browser-supported raster formats; the SERVER decodes/re-encodes again.
 const bitmap=await createImageBitmap(file);
 let png:Blob|null;
 try{
  const scale=Math.min(1,2048/bitmap.width,2048/bitmap.height);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(bitmap.width*scale));canvas.height=Math.max(1,Math.floor(bitmap.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image processing is unavailable.');
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  png=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
 }finally{bitmap.close();}
 if(!png || !png.size || png.size>limits[bucket])throw new Error('Processed image exceeds the upload limit. Choose a smaller image.');
 const body=new FormData();body.append('bucket',bucket);body.append('file',new File([png],'raster.png',{type:'image/png'}));
 const {data,error}=await supabaseRuntime.functions.invoke('upload-raster-image',{body});
 if(error || data?.success!==true || typeof data.publicUrl!=='string')throw new Error(error?.message || data?.error || 'Durable image upload failed.');
 // No data-URL or alternate-bucket fallback after an authorization/validation failure.
 const parsed=new URL(data.publicUrl);
 if(parsed.protocol!=='https:' || !parsed.pathname.includes(`/storage/v1/object/public/${bucket}/`))throw new Error('Invalid upload response.');
 return data.publicUrl;
}
