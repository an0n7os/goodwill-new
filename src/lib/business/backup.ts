import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {db} from '../db';
type SqliteModule={DatabaseSync:new(file:string,options?:{readOnly?:boolean})=>{close():void};backup:(source:unknown,destination:string)=>Promise<number>};
const root=()=>path.resolve(process.cwd(),'.backups',createHash('sha256').update(process.env.DATABASE_URL||'file:./dev.db').digest('hex').slice(0,12));
export function backupPath(name:string){if(!/^goodwill-\d{13}-[a-f0-9]{8}\.db$/.test(name))throw Error('Invalid backup name.');return path.join(root(),name);}
export async function listBackups(){await fs.mkdir(root(),{recursive:true,mode:0o700});const names=(await fs.readdir(root())).filter(n=>/^goodwill-\d{13}-[a-f0-9]{8}\.db$/.test(n));return Promise.all(names.sort().reverse().map(async name=>({name,size:(await fs.stat(backupPath(name))).size})));}
export async function createDatabaseBackup(){
 const url=process.env.DATABASE_URL||'file:./dev.db';if(!url.startsWith('file:'))throw Error('This local backup tool requires SQLite. Configure provider backups for a remote database.');
 const source=path.resolve(url.slice(5));await fs.stat(source);
 const sqlite=process.getBuiltinModule('node:sqlite') as SqliteModule|undefined;if(!sqlite?.backup)throw Error('Node 22.16 or newer with SQLite backup support is required.');
 await fs.mkdir(root(),{recursive:true,mode:0o700});const name=`goodwill-${Date.now()}-${crypto.randomUUID().replaceAll('-','').slice(0,8)}.db`;
 const connection=new sqlite.DatabaseSync(source,{readOnly:true});try{await sqlite.backup(connection,backupPath(name));await fs.chmod(backupPath(name),0o600);}finally{connection.close();}
 return {name,size:(await fs.stat(backupPath(name))).size};
}
let running:Promise<unknown>|null=null;
export async function dailyBackup(){
 if(running)return running;
 running=(async()=>{const files=await listBackups();const newest=files[0];if(newest&&Date.now()-Number(newest.name.split('-')[1])<24*60*60*1000){const {mirrorBackup}=await import('./restore');await mirrorBackup(newest.name);return;}
  const saved=await createDatabaseBackup();
  const {mirrorBackup}=await import('./restore');await mirrorBackup(saved.name);
  await db.auditLog.create({data:{actorId:'system',actorName:'System',action:'backup.daily',entityId:saved.name,details:JSON.stringify({bytes:saved.size})}});
  const keep=await listBackups();for(const file of keep.slice(14))await fs.unlink(backupPath(file.name));
 })().finally(()=>{running=null;});return running;
}
