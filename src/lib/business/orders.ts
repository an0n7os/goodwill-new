import {createHash} from 'node:crypto';
import type {Prisma} from '@/generated/prisma';
import {computeTotals} from '../pricing';
import {deliveryQuote} from '../deliveryPolicy';
import {audit,manager,money,nonnegative,positive,quantityValid,qty,transaction,type Actor,type Tx} from './shared';
import {movement} from './stock';

export type OrderInput={name:string;phone:string;email?:string;line1:string;city:string;pincode:string;deliveryType:string;paymentMethod:string;couponCode?:string;notes?:string;requestKey?:string;expectedTotal?:number;items:{productId:string;variantId?:string|null;quantity:number}[]};
const transitions:Record<string,string[]>={PLACED:['CONFIRMED','CANCELLED'],CONFIRMED:['PACKED','CANCELLED'],PACKED:['OUT_FOR_DELIVERY','READY_FOR_PICKUP','CANCELLED'],SHIPPED:['OUT_FOR_DELIVERY','DELIVERED','DELIVERY_FAILED'],OUT_FOR_DELIVERY:['DELIVERED','DELIVERY_FAILED','CANCELLED'],DELIVERY_FAILED:['OUT_FOR_DELIVERY','CANCELLED'],READY_FOR_PICKUP:['DELIVERED','CANCELLED'],DELIVERED:[],CANCELLED:[],RETURNED:[]};
function requestHash(data:object){return createHash('sha256').update(JSON.stringify(data)).digest('hex');}
export async function placeOrderCore(input:OrderInput,actor?:Actor,accountUserId?:string,internal?:{quotationId?:string;online?:boolean}){
 const name=input.name?.trim(),phone=input.phone?.replace(/\D/g,'').slice(-10),line1=input.line1?.trim(),city=input.city?.trim(),pin=input.pincode?.trim();
 if(!name||!line1||!city||phone?.length!==10||!/^\d{6}$/.test(pin||''))throw Error('Enter a valid name, phone and address.');
 if(input.paymentMethod!=='cod'&&!(internal?.online&&input.paymentMethod==='razorpay'))throw Error('Online payment is not enabled yet.');
 if(!['pickup','delivery'].includes(input.deliveryType))throw Error('Choose pickup or delivery.');
 if(!input.items?.length||input.items.length>100)throw Error('Your cart must contain 1–100 product lines.');
 if(!input.requestKey||!/^[A-Za-z0-9_-]{16,100}$/.test(input.requestKey))throw Error('Refresh checkout before placing this order.');
 const items=input.items.map(i=>({productId:i.productId,variantId:i.variantId||null,quantity:qty(i.quantity)})).sort((a,b)=>(a.productId+(a.variantId??'')).localeCompare(b.productId+(b.variantId??'')));
 if(new Set(items.map(i=>i.productId+':'+i.variantId)).size!==items.length)throw Error('Duplicate product lines are not allowed.');
 for(const i of input.items)positive(i.quantity);
 const hash=requestHash({name,phone,line1,city,pin,items,deliveryType:input.deliveryType,coupon:input.couponCode?.trim().toUpperCase()||'',accountUserId:accountUserId||null,channel:actor?'counter':'website',quotationId:internal?.quotationId||null,online:Boolean(internal?.online)});
 return transaction(async tx=>{
  const existing=await tx.order.findUnique({where:{requestKey:input.requestKey}});
  if(existing){if(existing.requestHash!==hash)throw Error('Checkout changed. Start a new checkout attempt.');return {order:existing,lines:[],totals:{subtotal:existing.subtotal,discount:existing.discount,deliveryCharge:existing.deliveryCharge,gstAmount:existing.gstAmount,total:existing.total},replayed:true};}
  const quotation=internal?.quotationId?await tx.quotation.findUniqueOrThrow({where:{id:internal.quotationId},include:{items:true}}):null;
  if(quotation&&(quotation.status!=='accepted'||quotation.orderId||quotation.validUntil<new Date()||input.deliveryType!=='pickup'||input.couponCode||quotation.items.length!==items.length||quotation.phone!==phone))throw Error('Quotation must be accepted, unexpired and unchanged before creating a pickup order.');
  const year=new Date().getFullYear(),prefix=`GW-${year}-`;
  const sequence=await tx.orderSequence.findUnique({where:{year}});
  const previous=sequence?[]:await tx.order.findMany({where:{orderNumber:{startsWith:prefix}},select:{orderNumber:true}});
  const maximum=previous.reduce((max,o)=>Math.max(max,Number(o.orderNumber.slice(prefix.length))||0),0);
  const counter=await tx.orderSequence.upsert({where:{year},create:{year,value:maximum+1},update:{value:{increment:1}}});
  const orderNo=prefix+String(counter.value).padStart(6,'0');
  const lines=[];
  for(const item of items){
   const p=await tx.product.findFirst({where:{id:item.productId,isActive:true},include:{variants:{select:{id:true}}}});if(!p)throw Error('A product is no longer available.');quantityValid(item.quantity,p.unit);
   if(p.variants.length&&!item.variantId)throw Error('Choose a product option before ordering.');
   const variant=item.variantId?await tx.productVariant.findFirst({where:{id:item.variantId,productId:p.id}}):null;if(item.variantId&&!variant)throw Error('The selected variant is no longer available.');
   const quoted=quotation?.items.find(i=>i.productId===p.id&&i.variantId===(variant?.id??null)&&i.quantity===item.quantity);
   if(quotation&&!quoted)throw Error('Quotation line changed.');
   const price=quoted?.price??variant?.price??p.price;if(!(price>0))throw Error(p.name+' is price on request.');
   if(p.trackStock)await movement(tx,{productId:p.id,variantId:variant?.id,delta:-item.quantity,type:'sale',reason:'Order '+orderNo,actorId:actor?.id});
   await tx.product.update({where:{id:p.id},data:{soldCount:{increment:item.quantity}}});
   lines.push({productId:p.id,variantId:variant?.id??null,name:p.name,variantName:variant?.name??null,price,quantity:item.quantity,gstRate:quoted?.gstRate??p.gstRate,stockTracked:p.trackStock,unit:p.unit});
  }
  const subtotal=money(lines.reduce((s,l)=>s+money(l.price*l.quantity),0));let coupon=null;
  if(input.couponCode){
   const c=await tx.coupon.findUnique({where:{code:input.couponCode.trim().toUpperCase()}});
   if(!c||!c.isActive||(c.expiresAt&&c.expiresAt<new Date())||(c.minOrder&&subtotal<c.minOrder)||(c.usageLimit&&c.usedCount>=c.usageLimit))throw Error('Coupon is no longer valid.');
   const updated=await tx.coupon.updateMany({where:{id:c.id,usedCount:c.usedCount},data:{usedCount:{increment:1}}});if(!updated.count)throw Error('Coupon changed. Please try again.');coupon=c;
  }
  const rules=await tx.deliveryZone.findMany();const quote=input.deliveryType==='delivery'?deliveryQuote(rules,pin!,subtotal,coupon?.type==='free_delivery'):null;
  if(input.deliveryType==='delivery'&&!quote)throw Error('Outside our regular delivery area. Choose store pickup or contact us.');
  const totals=computeTotals({lines,coupon,deliveryType:input.deliveryType,deliveryPolicy:quote?{charge:quote.baseCharge,freeAbove:quote.freeAbove}:undefined});
  if(input.expectedTotal!==undefined&&money(input.expectedTotal)!==totals.total)throw Error('Price or delivery charge changed. Refresh checkout and confirm the updated total.');
  const customer=await tx.customer.upsert({where:{phone:phone!},create:{name,phone:phone!,email:input.email?.trim().toLowerCase()||null},update:{}});
  if(!await tx.address.findFirst({where:{customerId:customer.id,line1,pincode:pin}}))await tx.address.create({data:{customerId:customer.id,name,phone:phone!,line1,city,pincode:pin!,isDefault:false}});
  const order=await tx.order.create({data:{requestKey:input.requestKey,requestHash:hash,accountUserId,channel:quotation?'quotation':actor?'counter':'website',orderNumber:orderNo,customerId:customer.id,...totals,couponCode:coupon?.code,deliveryType:input.deliveryType,shippingAddress:JSON.stringify({name,phone,line1,city,pincode:pin}),status:actor?'DELIVERED':'PLACED',paymentMethod:internal?.online?'razorpay':'cod',paymentStatus:'pending',notes:input.notes?.trim().slice(0,300),items:{create:lines.map(l=>({productId:l.productId,productName:l.name,variantId:l.variantId,variantName:l.variantName,unit:l.unit,stockTracked:l.stockTracked,price:l.price,quantity:l.quantity,total:money(l.price*l.quantity)}))},events:{create:{status:actor?'DELIVERED':'PLACED',actor:actor?.name??'customer',note:actor?'Counter sale recorded; payment collection recorded separately.':null}}}});
  if(quotation){const linked=await tx.quotation.updateMany({where:{id:quotation.id,status:'accepted',orderId:null},data:{orderId:order.id,status:'ordered'}});if(!linked.count)throw Error('Quotation already converted.');if(quotation.enquiryId)await tx.bulkEnquiry.update({where:{id:quotation.enquiryId},data:{status:'won'}});await audit(tx,{id:quotation.actorId,name:'Quotation workflow',role:'manager'},'quotation.convert',quotation.id,{orderId:order.id});}
  if(actor)await audit(tx,actor,'counter.sale',order.id,{orderNumber:orderNo,total:order.total});
  return {order,lines,totals,replayed:false};
 });
}

async function restoreStock(tx:Tx,order:{id:string;orderNumber:string;couponCode:string|null},actor:Actor){
 const lines=await tx.orderItem.findMany({where:{orderId:order.id}});
 for(const item of lines){
  // Stable variant identity is recorded on all new orders. Old named variants are
  // resolved only when exactly one matching variant still exists.
  let variantId=item.variantId;
  if(!variantId&&item.variantName){const matches=await tx.productVariant.findMany({where:{productId:item.productId,name:item.variantName}});if(matches.length!==1)throw Error('Old variant needs manager review before stock can be restored.');variantId=matches[0].id;}
  if(item.stockTracked)await movement(tx,{productId:item.productId,variantId,delta:item.quantity,type:'cancel_restore',reason:'Cancelled '+order.orderNumber,actorId:actor.id});
  const p=await tx.product.findUniqueOrThrow({where:{id:item.productId}});await tx.product.update({where:{id:p.id},data:{soldCount:Math.max(0,p.soldCount-item.quantity)}});
 }
 if(order.couponCode)await tx.coupon.updateMany({where:{code:order.couponCode,usedCount:{gt:0}},data:{usedCount:{decrement:1}}});
}
export type OrderChange={status?:string;note?:string;expectedDate?:string|null;deliveryAgent?:string|null;adminNote?:string|null;paymentStatus?:string;expectedVersion?:number;cashCollected?:number;cashRemitted?:number;deliveryFailure?:string|null};
export async function changeOrderCore(id:string,input:OrderChange,actor:Actor,customerCancel=false){
 return transaction(async tx=>{
  const order=await tx.order.findUniqueOrThrow({where:{id}});
  if(input.expectedVersion!==undefined&&input.expectedVersion!==order.version)throw Error('Order changed. Refresh before saving.');
  if(customerCancel&&!['PLACED','CONFIRMED'].includes(order.status)){if(order.status==='CANCELLED')return order;throw Error('This order can no longer be cancelled online.');}
  const status=input.status&&input.status!==order.status?input.status:undefined;
  if(status&&!transitions[order.status]?.includes(status))throw Error('This order cannot move from '+order.status+' to '+status+'.');
  if(status==='OUT_FOR_DELIVERY'&&order.deliveryType==='pickup'||status==='READY_FOR_PICKUP'&&order.deliveryType!=='pickup')throw Error('Status does not match the delivery method.');
  if(status==='DELIVERY_FAILED'&&!input.deliveryFailure?.trim())throw Error('Enter the delivery failure reason.');
  if(input.paymentStatus!==undefined||input.cashRemitted!==undefined)manager(actor);
  const data:Prisma.OrderUpdateManyMutationInput={version:{increment:1}};
  const credits=await tx.returnEntry.aggregate({where:{orderId:id},_sum:{creditAmount:true}});const netTotal=money(order.total-(credits._sum.creditAmount??0));
  if(status)data.status=status;
  if(input.expectedDate!==undefined){const date=input.expectedDate?new Date(input.expectedDate+'T18:00:00+05:30'):null;if(date&&Number.isNaN(date.getTime()))throw Error('Invalid delivery date.');data.expectedDate=date;}
  if(input.deliveryAgent!==undefined)data.deliveryAgent=input.deliveryAgent?.trim().slice(0,120)||null;
  if(input.adminNote!==undefined)data.adminNote=input.adminNote?.trim().slice(0,1000)||null;
  if(input.deliveryFailure!==undefined)data.deliveryFailure=input.deliveryFailure?.trim().slice(0,300)||null;
  if(order.paymentMethod==='razorpay'&&(input.cashCollected!==undefined||input.cashRemitted!==undefined||input.paymentStatus!==undefined))throw Error('Online payments are reconciled with the payment provider.');
  if(input.cashCollected!==undefined){nonnegative(input.cashCollected);if(order.status==='CANCELLED'&&input.cashCollected!==order.cashCollected)throw Error('Cancelled orders cannot collect more money.');if(input.cashCollected<order.cashCollected||input.cashCollected>Math.max(order.cashCollected,netTotal))throw Error('Collection cannot decrease or exceed the order balance after returns.');data.cashCollected=money(input.cashCollected);if(input.cashCollected>order.cashCollected&&input.cashCollected>=netTotal)data.paymentStatus='paid';}
  if(input.cashRemitted!==undefined){nonnegative(input.cashRemitted);if(input.cashRemitted<order.cashRemitted||input.cashRemitted>(input.cashCollected??order.cashCollected))throw Error('Remittance cannot decrease or exceed cash collected.');data.cashRemitted=money(input.cashRemitted);}
  if(input.paymentStatus){if(!['pending','paid','refunded','refund_due','cancelled'].includes(input.paymentStatus))throw Error('Invalid payment status.');if(input.paymentStatus==='paid'&&(input.cashCollected??order.cashCollected)<netTotal)throw Error('Record the actual cash collected before marking paid.');if(['refund_due','refunded','cancelled'].includes(input.paymentStatus))throw Error('Payment cancellation and refunds are set by their own workflow.');if(order.paymentStatus==='paid'&&input.paymentStatus==='pending')throw Error('Use a refund to reverse a received payment.');data.paymentStatus=input.paymentStatus;}
  if(status==='CANCELLED')data.paymentStatus=order.cashCollected>0||order.paymentStatus==='paid'?'refund_due':'cancelled';
  const changed=await tx.order.updateMany({where:{id,version:order.version,status:order.status},data});if(changed.count!==1)throw Error('Order changed. Please retry.');
  if(status==='CANCELLED')await restoreStock(tx,order,actor);
  const note=input.note?.trim().slice(0,300)||null;
  if(status||note)await tx.orderEvent.create({data:{orderId:id,status:status??order.status,note,actor:actor.name}});
  await audit(tx,actor,'order.update',id,{before:{status:order.status,cashCollected:order.cashCollected,cashRemitted:order.cashRemitted},input});
  return tx.order.findUniqueOrThrow({where:{id}});
 });
}
