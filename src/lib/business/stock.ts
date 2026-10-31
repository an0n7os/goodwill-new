import {audit,manager,nonnegative,quantityValid,qty,transaction,type Actor,type Tx} from './shared';
export async function movement(tx:Tx,input:{productId:string;variantId?:string|null;delta:number;type:string;reason:string;actorId?:string}){
 const product=await tx.product.findUniqueOrThrow({where:{id:input.productId}});
 if(input.delta===0)return product.stock;
 quantityValid(Math.abs(input.delta),product.unit);
 if(input.variantId){
  const variant=await tx.productVariant.findFirst({where:{id:input.variantId,productId:product.id}});if(!variant)throw Error('Variant does not belong to this product.');
  const changed=await tx.productVariant.updateMany({where:{id:variant.id,stock:input.delta<0?{gte:-input.delta}:undefined},data:{stock:{increment:input.delta}}});if(!changed.count)throw Error('Not enough stock.');
  const fresh=await tx.productVariant.findUniqueOrThrow({where:{id:variant.id}});
  await tx.stockMovement.create({data:{productId:product.id,variantId:variant.id,qty:input.delta,balanceAfter:qty(fresh.stock),type:input.type,reason:input.reason,userId:input.actorId}});return fresh.stock;
 }
 const changed=await tx.product.updateMany({where:{id:product.id,stock:input.delta<0?{gte:-input.delta}:undefined},data:{stock:{increment:input.delta}}});if(!changed.count)throw Error('Not enough stock.');
 const fresh=await tx.product.findUniqueOrThrow({where:{id:product.id}});
 await tx.stockMovement.create({data:{productId:product.id,qty:input.delta,balanceAfter:qty(fresh.stock),type:input.type,reason:input.reason,userId:input.actorId}});return fresh.stock;
}
export async function adjustStock(input:{productId:string;variantId?:string|null;stock:number;expectedStock?:number;reason:string},actor:Actor){
 manager(actor);nonnegative(input.stock,'Stock');if(!input.reason.trim())throw Error('A reason is required.');
 return transaction(async tx=>{
  const p=await tx.product.findUniqueOrThrow({where:{id:input.productId}});if(input.stock>0)quantityValid(input.stock,p.unit);
  const v=input.variantId?await tx.productVariant.findFirst({where:{id:input.variantId,productId:p.id}}):null;if(input.variantId&&!v)throw Error('Variant does not belong to this product.');
  const old=v?.stock??p.stock;if(input.expectedStock!==undefined&&old!==input.expectedStock)throw Error('Stock changed since this page opened. Refresh and try again.');
  const where={id:v?.id??p.id,stock:old};
  const updated=v?await tx.productVariant.updateMany({where,data:{stock:input.stock}}):await tx.product.updateMany({where,data:{stock:input.stock}});
  if(updated.count!==1)throw Error('Stock changed. Refresh and try again.');
  await tx.stockMovement.create({data:{productId:p.id,variantId:v?.id,qty:qty(input.stock-old),balanceAfter:input.stock,type:'adjustment',reason:input.reason.trim().slice(0,500),userId:actor.id}});
  await audit(tx,actor,'stock.adjust',p.id,{before:old,after:input.stock,variantId:v?.id,reason:input.reason});return {stock:input.stock};
 });
}
