import {audit,manager,money,positive,qty,quantityValid,transaction,type Actor} from './shared';
import {movement} from './stock';
import {allocateNetLines} from '../pricing';
export async function returnItem(input:{orderItemId:string;quantity:number;disposition:'saleable'|'damaged';reason:string;requestKey:string},actor:Actor){
 manager(actor);positive(input.quantity);if(!input.reason.trim()||!input.requestKey)throw Error('Return reason is required.');if(!['saleable','damaged'].includes(input.disposition))throw Error('Choose saleable or damaged.');
 return transaction(async tx=>{
  const old=await tx.returnEntry.findUnique({where:{requestKey:input.requestKey}});if(old){if(old.orderItemId!==input.orderItemId||old.quantity!==input.quantity||old.disposition!==input.disposition||old.reason!==input.reason.trim().slice(0,500))throw Error('Return retry does not match.');return old;}
  const item=await tx.orderItem.findUniqueOrThrow({where:{id:input.orderItemId}}),order=await tx.order.findUniqueOrThrow({where:{id:item.orderId}});
  if(!['DELIVERED','RETURNED'].includes(order.status))throw Error('Only delivered orders can be returned.');quantityValid(input.quantity,item.unit);
  if(qty(item.returnedQty+input.quantity)>item.quantity)throw Error('Return exceeds the remaining delivered quantity.');
  const changed=await tx.orderItem.updateMany({where:{id:item.id,returnedQty:item.returnedQty},data:{returnedQty:{increment:input.quantity}}});if(!changed.count)throw Error('Return changed. Refresh and try again.');
  const allItems=await tx.orderItem.findMany({where:{orderId:order.id},orderBy:{id:'asc'}});
  const lineNet=allocateNetLines(allItems.map(i=>({id:i.id,total:i.total})),order.discount).get(item.id)??0;
  const lineReturns=await tx.returnEntry.aggregate({where:{orderItemId:item.id},_sum:{creditAmount:true}});
  const remainingCredit=money(lineNet-(lineReturns._sum.creditAmount??0));
  const creditAmount=qty(item.returnedQty+input.quantity)>=item.quantity?remainingCredit:Math.min(remainingCredit,money(lineNet*input.quantity/item.quantity));
  const previous=await tx.returnEntry.aggregate({where:{orderId:order.id},_sum:{creditAmount:true,refundDue:true}});
  const capture=order.paymentMethod==='razorpay'?await tx.paymentAttempt.findUnique({where:{orderId:order.id}}):null;
  const received=order.cashCollected||(capture?.status==='captured'?capture.amount/100:order.paymentMethod!=='razorpay'&&order.paymentStatus==='paid'?order.total:0);
  const refund=money(Math.max(0,received-(order.total-(previous._sum.creditAmount??0)-creditAmount)-(previous._sum.refundDue??0)));
  const entry=await tx.returnEntry.create({data:{requestKey:input.requestKey,orderId:order.id,orderItemId:item.id,productId:item.productId,variantId:item.variantId,quantity:input.quantity,disposition:input.disposition,reason:input.reason.trim().slice(0,500),refundDue:refund,creditAmount,actorId:actor.id}});
  let variantId=item.variantId;if(!variantId&&item.variantName){const matches=await tx.productVariant.findMany({where:{productId:item.productId,name:item.variantName}});if(matches.length!==1)throw Error('Old variant needs manager review.');variantId=matches[0].id;}
  if(item.stockTracked){
   if(input.disposition==='saleable')await movement(tx,{productId:item.productId,variantId,delta:input.quantity,type:'return',reason:'Return '+order.orderNumber,actorId:actor.id});
   else {await tx.product.update({where:{id:item.productId},data:{damagedStock:{increment:input.quantity}}});await tx.stockMovement.create({data:{productId:item.productId,variantId:item.variantId,type:'return_damaged',qty:0,balanceAfter:item.variantId?(await tx.productVariant.findUniqueOrThrow({where:{id:item.variantId}})).stock:(await tx.product.findUniqueOrThrow({where:{id:item.productId}})).stock,reason:`${input.quantity} damaged units: ${input.reason}`,userId:actor.id}});}
  }
  const items=await tx.orderItem.findMany({where:{orderId:order.id}});const complete=items.every(i=>qty(i.returnedQty)>=i.quantity);
  const product=await tx.product.findUniqueOrThrow({where:{id:item.productId}});await tx.product.update({where:{id:product.id},data:{soldCount:Math.max(0,qty(product.soldCount-input.quantity))}});
  const updated=await tx.order.updateMany({where:{id:order.id,version:order.version},data:{version:{increment:1},status:complete?'RETURNED':order.status,paymentStatus:refund>0?'refund_due':complete&&received===0?'cancelled':order.paymentStatus}});if(!updated.count)throw Error('Order changed. Retry the return.');
  await tx.orderEvent.create({data:{orderId:order.id,status:complete?'RETURNED':order.status,note:`Returned ${input.quantity} ${item.unit}: ${item.productName}. Refund reviewed separately.`,actor:actor.name}});
  await audit(tx,actor,'return.record',entry.id,{orderId:order.id,itemId:item.id,quantity:input.quantity,disposition:input.disposition,refundDue:refund});return entry;
 });
}
export async function recordReturnRefund(id:string,amount:number,actor:Actor){
 manager(actor);positive(amount,'Refund amount');
 return transaction(async tx=>{
  const entry=await tx.returnEntry.findUniqueOrThrow({where:{id}}),order=await tx.order.findUniqueOrThrow({where:{id:entry.orderId}});
  if(order.paymentMethod==='razorpay')throw Error('Use the online refund workflow for this payment.');
  if(entry.refundPaid===money(amount))return entry;if(amount<entry.refundPaid)throw Error('A recorded refund cannot be reduced.');
  const other=await tx.returnEntry.aggregate({where:{orderId:order.id},_sum:{refundPaid:true}});
  const paid=order.cashCollected||(['paid','partially_refunded','refund_due','refunded'].includes(order.paymentStatus)?order.total:0);
  if(money(amount)>entry.refundDue||money((other._sum.refundPaid??0)+amount-entry.refundPaid)>paid)throw Error('Refund cannot exceed the item entitlement or money actually received.');
  const changed=await tx.returnEntry.updateMany({where:{id,refundPaid:entry.refundPaid},data:{refundPaid:money(amount)}});if(!changed.count)throw Error('Refund already changed.');
  const all=await tx.returnEntry.findMany({where:{orderId:order.id}});const allPaid=all.every(r=>r.refundPaid>=r.refundDue);
  await tx.order.update({where:{id:order.id},data:{paymentStatus:allPaid?(order.status==='RETURNED'?'refunded':'partially_refunded'):'refund_due',version:{increment:1}}});
  await audit(tx,actor,'refund.record',id,{orderId:order.id,amount:money(amount)});return tx.returnEntry.findUniqueOrThrow({where:{id}});
 });
}
