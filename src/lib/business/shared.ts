import type {Prisma} from '@/generated/prisma';
import {db} from '../db';
export type Actor={id:string;name:string;role:string};
export type Tx=Prisma.TransactionClient;
export const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export const qty=(n:number)=>Math.round(n*1000)/1000;
export function positive(n:number,label='Quantity'){if(!Number.isFinite(n)||n<=0||n>10000000)throw Error(label+' must be positive and finite.');}
export function nonnegative(n:number,label='Amount'){if(!Number.isFinite(n)||n<0||n>1000000000)throw Error(label+' must be non-negative and finite.');}
export function quantityValid(n:number,unit:string){positive(n);if(Math.abs(n-qty(n))>0.0000001)throw Error('Use at most 3 decimal places.');if(!['metre','meter','m','kg','litre','liter'].includes(unit.toLowerCase())&&!Number.isInteger(n))throw Error('This product requires whole units.');}
export function manager(actor:Actor){if(!['owner','manager'].includes(actor.role))throw Error('Only an owner or manager can do this.');}
export function audit(tx:Tx,actor:Actor,action:string,entityId:string,details:object){return tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action,entityId,details:JSON.stringify(details)}});}
async function retry<T>(fn:(tx:Tx)=>Promise<T>):Promise<T>{
 for(let attempt=0;;attempt++)try{return await db.$transaction(fn,{timeout:15000,maxWait:10000});}
 catch(e){const msg=e instanceof Error?e.message:String(e);if(attempt>=3||!/SQLITE_BUSY|database is locked|write conflict|P2034|Unique constraint failed[\s\S]*(orderNumber|requestKey)/i.test(msg))throw e;await new Promise(resolve=>setTimeout(resolve,30*(attempt+1)));}
}
const queue=globalThis as unknown as {goodwillWrites?:Map<string,Promise<void>>};
export async function transaction<T>(fn:(tx:Tx)=>Promise<T>):Promise<T>{
 const url=process.env.DATABASE_URL||'file:./dev.db';if(!url.startsWith('file:'))return retry(fn);
 const writes=queue.goodwillWrites??=new Map();const previous=writes.get(url)??Promise.resolve();let release=()=>{};
 const next=new Promise<void>(resolve=>{release=resolve;});writes.set(url,next);
 await previous;try{return await retry(fn);}finally{release();if(writes.get(url)===next)writes.delete(url);}
}
