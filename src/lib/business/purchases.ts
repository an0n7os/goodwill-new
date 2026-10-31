import {audit,manager,money,nonnegative,positive,qty,quantityValid,transaction,type Actor} from './shared';
import {movement} from './stock';
export type ReceiptInput={supplierId:string;reference:string;requestKey:string;paid:number;notes?:string;items:{productId:string;variantId?:string|null;quantity:number;unitFactor:number;unitCost:number}[]};
export async function receivePurchase(input:ReceiptInput,actor:Actor){
 manager(actor);if(!input.reference.trim()||!input.requestKey||!input.items.length||input.items.length>100)throw Error('Enter supplier bill/reference and 1–100 product lines.');nonnegative(input.paid);
 return transaction(async tx=>{
  const old=await tx.purchase.findUnique({where:{requestKey:input.requestKey},include:{items:true}});if(old){const normalize=(items:ReceiptInput['items'])=>JSON.stringify(items.map(i=>[i.productId,i.variantId||null,i.quantity,i.unitFactor,i.unitCost]));if(old.supplierId!==input.supplierId||old.reference!==input.reference.trim()||normalize(old.items)!==normalize(input.items))throw Error('Receipt retry key does not match.');return old;}
  await tx.supplier.findUniqueOrThrow({where:{id:input.supplierId}});
  if(await tx.purchase.findUnique({where:{supplierId_reference:{supplierId:input.supplierId,reference:input.reference.trim()}}}))throw Error('This supplier bill has already been received.');
  let total=0;
  for(const line of input.items){positive(line.quantity);positive(line.unitFactor,'Pack conversion');nonnegative(line.unitCost,'Unit cost');const p=await tx.product.findUniqueOrThrow({where:{id:line.productId}});quantityValid(qty(line.quantity*line.unitFactor),p.unit);total+=line.quantity*line.unitCost;}
  total=money(total);if(input.paid>total)throw Error('Paid amount cannot exceed the purchase total.');
  const receipt=await tx.purchase.create({data:{supplierId:input.supplierId,reference:input.reference.trim(),requestKey:input.requestKey,total,paid:input.paid,actorId:actor.id,notes:input.notes?.trim().slice(0,500),items:{create:input.items.map(i=>({productId:i.productId,variantId:i.variantId||null,quantity:i.quantity,unitFactor:i.unitFactor,unitCost:i.unitCost}))}},include:{items:true}});
  for(const line of input.items){
   const p=await tx.product.findUniqueOrThrow({where:{id:line.productId},include:{variants:true}});const amount=qty(line.quantity*line.unitFactor);
   await movement(tx,{productId:p.id,variantId:line.variantId,delta:amount,type:'purchase',reason:'Supplier bill '+receipt.reference,actorId:actor.id});
   const available=p.variants.length?p.variants.reduce((s,v)=>s+v.stock,0):p.stock;
   const oldValue=Math.max(0,available)*(p.costPrice??0);const average=(oldValue+line.quantity*line.unitCost)/(Math.max(0,available)+amount);
   await tx.product.update({where:{id:p.id},data:{costPrice:money(average)}});
  }
  await audit(tx,actor,'purchase.receive',receipt.id,{supplierId:input.supplierId,reference:receipt.reference,total});return receipt;
 });
}
