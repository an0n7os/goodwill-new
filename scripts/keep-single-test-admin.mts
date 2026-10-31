import {db} from '../src/lib/db';
import {verifyPassword} from '../src/lib/adminSession';
if(process.env.GOODWILL_WORKFLOW_TEST!=='1'||!process.env.DATABASE_URL?.endsWith('/imports/workflow-schema-check.db'))throw Error('Test copy only');
await db.$transaction(async tx=>{
 const admin=await tx.adminUser.findUniqueOrThrow({where:{email:'qa-owner@goodwill.example.invalid'}});
 if(!verifyPassword('admin123',admin.password))throw Error('Requested admin login must work before removing other accounts');
 await tx.adminUser.update({where:{id:admin.id},data:{name:'Admin',isActive:true}});
 const removed=await tx.adminUser.deleteMany({where:{id:{not:admin.id}}});
 await tx.auditLog.create({data:{actorId:admin.id,actorName:'Admin',action:'admin.accounts.consolidated',entityId:admin.id,details:JSON.stringify({removed:removed.count,scope:'test copy',requestedByUser:true})}});
});
console.log('Admin accounts remaining:',await db.adminUser.count());
await db.$disconnect();
