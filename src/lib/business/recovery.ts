import {randomBytes,createHash} from 'node:crypto';
import {db} from '../db';import {hashPassword} from '../adminSession';import {checkRateLimit} from './rateLimit';import {audit,transaction} from './shared';import {authEmail} from './notifications';import {siteUrl} from '../site';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function requestAdminRecovery(email:string){
 const normalized=email.trim().toLowerCase();if(!await checkRateLimit('admin-recovery',normalized,3,15*60000))return;
 const user=await db.adminUser.findUnique({where:{email:normalized}});if(!user?.isActive)return;
 const token=randomBytes(32).toString('base64url');await transaction(async tx=>{await tx.recoveryToken.deleteMany({where:{adminId:user.id}});await tx.recoveryToken.create({data:{hash:hash(token),adminId:user.id,expiresAt:new Date(Date.now()+30*60000)}});});
 await authEmail(normalized,siteUrl()+'/recover?admin=1&token='+token,'admin-reset');
}
export async function resetAdminPassword(token:string,password:string){
 if(!/^[A-Za-z0-9_-]{43}$/.test(token)||password.length<12||password.length>128)throw Error('Use a valid recovery link and a password of 12–128 characters.');
 const passwordHash=hashPassword(password);
 await transaction(async tx=>{const row=await tx.recoveryToken.findUnique({where:{hash:hash(token)}});if(!row||row.usedAt||row.expiresAt<new Date())throw Error('This recovery link has expired or was already used.');const user=await tx.adminUser.findUniqueOrThrow({where:{id:row.adminId}});if(!user.isActive)throw Error('This account is disabled. Contact the owner.');const used=await tx.recoveryToken.updateMany({where:{hash:row.hash,usedAt:null},data:{usedAt:new Date()}});if(!used.count)throw Error('Recovery link already used.');await tx.adminUser.update({where:{id:user.id},data:{password:passwordHash,sessionVersion:{increment:1}}});await audit(tx,{id:user.id,name:user.name,role:user.role},'admin.password.recovered',user.id,{});});
}
