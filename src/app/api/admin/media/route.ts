import {requireAdmin} from '@/lib/adminGuard';import {manager} from '@/lib/business/shared';import {uploadProductImage} from '@/lib/business/media';import {revalidatePath} from 'next/cache';
export const runtime='nodejs';
export async function POST(request:Request){
 try{const actor=await requireAdmin();manager(actor);const expected=new URL(process.env.BETTER_AUTH_URL||process.env.URL||request.url).origin;if(request.headers.get('origin')!==expected)return new Response('Invalid origin',{status:403});
 const reader=request.body?.getReader();if(!reader)throw Error('No file uploaded.');const chunks:Uint8Array[]=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>9*1024*1024){await reader.cancel();return new Response('Upload exceeds 8 MB',{status:413});}chunks.push(value);}const body=new Uint8Array(length);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
 const form=await new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body}).formData();const file=form.get('file');if(!(file instanceof File))throw Error('Select a photo.');
 const image=await uploadProductImage({productId:String(form.get('productId')||''),bytes:new Uint8Array(await file.arrayBuffer()),fit:form.get('fit')==='cover'?'cover':'contain',ratio:form.get('ratio')==='landscape'?'landscape':'square',alt:String(form.get('alt')||'')},actor);revalidatePath('/','layout');return Response.json({success:true,image});
 }catch(e){return Response.json({success:false,error:e instanceof Error&& !/prisma|database|constraint/i.test(e.message)?e.message:'Could not save photo.'},{status:400});}
}
