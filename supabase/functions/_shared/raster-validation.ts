// Never trust extensions or browser MIME labels. Decode pixels and re-encode before publishing.
export const MAX_PIXELS = 4_000_000;
export function rasterDimensions(bytes: Uint8Array, mime: string) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0, height = 0;
  if (mime === 'image/png') {
    const signature = [137,80,78,71,13,10,26,10];
    if (bytes.length < 33 || !signature.every((n,i)=>bytes[i]===n) ||
      v.getUint32(8) !== 13 || v.getUint32(12) !== 0x49484452) throw new Error('Invalid PNG content');
    width=v.getUint32(16); height=v.getUint32(20);
  } else if (mime === 'image/jpeg') {
    if(bytes.length<4 || bytes[0]!==255 || bytes[1]!==216) throw new Error('Invalid JPEG content');
    let p=2;
    while(p+3<bytes.length){
      if(bytes[p++]!==255) throw new Error('Invalid JPEG marker');
      while(bytes[p]===255)p++;
      const marker=bytes[p++];
      if(marker===0xd9 || marker===0xda)break;
      if(marker===0x01 || marker>=0xd0&&marker<=0xd7)continue;
      if(p+2>bytes.length)throw new Error('Truncated JPEG');
      const size=v.getUint16(p);
      if(size<2 || p+size>bytes.length)throw new Error('Truncated JPEG');
      if([0xc0,0xc1,0xc2].includes(marker)){
        if(size<8)throw new Error('Invalid JPEG dimensions');
        height=v.getUint16(p+3);width=v.getUint16(p+5);break;
      }
      p+=size;
    }
  } else throw new Error('Only PNG or JPEG content is accepted by the server');
  if(!width || !height || width>4096 || height>4096 || width*height>MAX_PIXELS)
    throw new Error('Image dimensions exceed the safe pixel limit');
  return {width,height};
}
export async function sanitizeRaster(bytes:Uint8Array,mime:string,limit:number,
  decode:(data:Uint8Array,mime:string)=>Promise<{width:number;height:number;data:Uint8Array}>,
  encode:(image:{width:number;height:number;data:Uint8Array})=>Promise<Uint8Array>) {
  if(!bytes.length || bytes.length>limit)throw new Error('Image size exceeds the limit');
  const expected=rasterDimensions(bytes,mime);
  const image=await decode(bytes,mime);
  if(image.width!==expected.width || image.height!==expected.height || image.data.length!==image.width*image.height*4)
    throw new Error('Invalid decoded image');
  const result=await encode(image);
  if(!result.length || result.length>limit)throw new Error('Sanitized image size exceeds the limit');
  rasterDimensions(result,'image/png');
  return result;
}
