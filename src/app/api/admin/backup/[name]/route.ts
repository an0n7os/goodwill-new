import {requireOwner} from '@/lib/adminGuard';
import {backupPath} from '@/lib/business/backup';
import fs from 'node:fs/promises';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){
 try{await requireOwner();}catch{return new Response('Owner access required',{status:403});}
 try{const {name}=await params;const data=await fs.readFile(backupPath(name));return new Response(new Uint8Array(data),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${name}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Backup not found',{status:404});}
}
