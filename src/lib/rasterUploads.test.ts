import { beforeEach, describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('./supabase',()=>({isSupabaseConfigured:true,supabaseRuntime:{functions:{invoke:state.invoke}}}));
import { validateRasterFile,uploadValidatedImage } from './rasterUploads';
beforeEach(()=>{state.invoke.mockReset();vi.stubGlobal('createImageBitmap',vi.fn().mockResolvedValue({width:100,height:50,close:vi.fn()}));vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn()} as never);vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(cb=>cb(new Blob(['normalized pixels'],{type:'image/png'})));});
describe('validated image upload boundary',()=>{
 it.each(['image/svg+xml','text/html','application/javascript'])('rejects %s before invoking the server',async type=>{await expect(uploadValidatedImage(new File(['x'],'x.png',{type}),'banners')).rejects.toThrow('SVG');expect(state.invoke).not.toHaveBeenCalled();});
 it('rejects oversized/empty avatars',()=>{expect(()=>validateRasterFile(new File([],'x.png',{type:'image/png'}),'avatars')).toThrow('2 MB');expect(()=>validateRasterFile(new File([new Uint8Array(2097153)],'x.jpg',{type:'image/jpeg'}),'avatars')).toThrow('2 MB');});
 it('submits normalized PNG via authenticated function and returns a durable bucket URL',async()=>{
  state.invoke.mockResolvedValue({data:{success:true,publicUrl:'https://prycanbnxuihxhskallw.supabase.co/storage/v1/object/public/avatars/user/id.png'},error:null});
  const result=await uploadValidatedImage(new File(['webp'],'x.webp',{type:'image/webp'}),'avatars');
  expect(result).toContain('/avatars/');const body=state.invoke.mock.calls[0][1].body as FormData;expect(body.get('bucket')).toBe('avatars');expect((body.get('file') as File).type).toBe('image/png');
 });
 it('does not bypass server denial with another bucket/data URL',async()=>{state.invoke.mockResolvedValue({data:null,error:{message:'Content denied'}});await expect(uploadValidatedImage(new File(['x'],'x.png',{type:'image/png'}),'banners')).rejects.toThrow('Content denied');expect(state.invoke).toHaveBeenCalledTimes(1);});
 it('rejects spoofed success and unsafe URL responses',async()=>{for(const publicUrl of ['data:image/png;base64,x','https://evil.test/x.png']){state.invoke.mockResolvedValue({data:{success:true,publicUrl},error:null});await expect(uploadValidatedImage(new File(['x'],'x.png',{type:'image/png'}),'banners')).rejects.toThrow('Invalid upload');}});
});
