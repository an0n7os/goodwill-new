import {db} from '../db';
import {Resend} from 'resend';
import {createHash} from 'node:crypto';
import {escapeHtml,siteUrl,testSite} from '../site';
import {transaction} from './shared';

export async function queueEmail(input:{key:string;recipient:string;subject:string;html:string}){
 if(!input.recipient||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.recipient))return null;
 return db.notification.upsert({where:{key:input.key},create:{...input,status:testSite()?'test':'queued'},update:{}});
}
export async function sendNotification(id:string){
 if(testSite())return {sent:false,reason:'Test mailbox only'};
 if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL)return {sent:false,reason:'Email provider needs configuration'};
 const row=await transaction(async tx=>{const n=await tx.notification.findUniqueOrThrow({where:{id}});if(!['queued','failed'].includes(n.status)||n.attempts>=5)return null;const changed=await tx.notification.updateMany({where:{id,status:n.status,attempts:n.attempts},data:{status:'sending',attempts:{increment:1}}});return changed.count?n:null;});
 if(!row)return {sent:false,reason:'Already sent or in progress'};
 try{const result=await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.RESEND_FROM_EMAIL!,to:row.recipient,subject:row.subject,html:row.html},{idempotencyKey:row.key});if(result.error)throw Error('Provider rejected the email');await db.notification.update({where:{id},data:{status:'sent',sentAt:new Date(),lastError:null}});return {sent:true};}
 catch {await db.notification.update({where:{id},data:{status:'failed',lastError:'Email delivery failed. Check provider configuration and retry.'}});return {sent:false,reason:'Email delivery failed'};}
}
export async function authEmail(to:string,url:string,kind:'verify'|'customer-reset'|'admin-reset'){
 const title=kind==='verify'?'Verify your Goodwill email':'Reset your Goodwill password';
 const row=await queueEmail({key:kind+'-'+createHash('sha256').update(url).digest('hex'),recipient:to,subject:title,html:`<h2>${title}</h2><p>Use the link below. It expires automatically and can only be used for this request. If you did not request this, ignore this email.</p><p><a href="${escapeHtml(url)}">${title}</a></p>`});if(row)await sendNotification(row.id);
}
export async function orderNotification(id:string,event:string){
 const o=await db.order.findUniqueOrThrow({where:{id},include:{customer:true,items:true}});
 const address=JSON.parse(o.shippingAddress) as {phone:string;name:string};
 const body=`<h2>Order ${escapeHtml(o.orderNumber)}</h2><p>${escapeHtml(event.replaceAll('_',' '))}</p><ul>${o.items.map(i=>`<li>${escapeHtml(i.productName)} × ${i.quantity}</li>`).join('')}</ul><p>Order total ₹${o.total.toFixed(2)}. Payment: ${escapeHtml(o.paymentStatus)}.</p><p><a href="${escapeHtml(siteUrl()+'/track-order?orderNumber='+encodeURIComponent(o.orderNumber)+'&phone='+encodeURIComponent(address.phone))}">Track order</a></p>`;
 for(const recipient of new Set([o.customer.email,process.env.ADMIN_NOTIFICATION_EMAIL].filter((x):x is string=>Boolean(x)))){const row=await queueEmail({key:`order-${id}-${event}-${recipient}`,recipient,subject:`Goodwill ${o.orderNumber}: ${event.replaceAll('_',' ')}`,html:body});if(row)await sendNotification(row.id);}
}
export async function drainNotifications(){const rows=await db.notification.findMany({where:{status:{in:['queued','failed']},attempts:{lt:5}},take:20,orderBy:{createdAt:'asc'}});for(const row of rows)await sendNotification(row.id);}
