import {createHash} from 'node:crypto';
import {db} from '../db';
import {transaction} from './shared';
export async function checkRateLimit(scope:string,identity:string,limit=8,windowMs=15*60*1000){
 const key=createHash('sha256').update(scope+':'+identity.toLowerCase().trim()).digest('hex');const now=new Date();
 return transaction(async tx=>{await tx.rateLimitBucket.updateMany({where:{key,startedAt:{lt:new Date(now.getTime()-windowMs)}},data:{count:0,startedAt:now}});const bucket=await tx.rateLimitBucket.upsert({where:{key},create:{key,count:1,startedAt:now},update:{count:{increment:1}}});return bucket.count<=limit;});
}
export async function clearRateLimit(scope:string,identity:string){const key=createHash('sha256').update(scope+':'+identity.toLowerCase().trim()).digest('hex');await db.rateLimitBucket.deleteMany({where:{key}});}
