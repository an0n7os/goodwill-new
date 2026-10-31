import fs from 'node:fs/promises';import {mediaPath} from '@/lib/business/media';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){try{const {name}=await params;return new Response(new Uint8Array(await fs.readFile(mediaPath(name))),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Photo not found',{status:404});}}
