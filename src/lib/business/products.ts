import {audit,manager,nonnegative,quantityValid,transaction,type Actor} from './shared';
export type ProductEdit={name:string;nameML?:string;slug:string;sku:string;description?:string;descriptionML?:string;mrp:number;price:number;costPrice?:number;gstRate?:number;unit?:string;stock:number;expectedStock?:number;categoryId:string;brandId?:string;imageUrl?:string};
export async function saveProductCore(input:ProductEdit,actor:Actor,id?:string){
 manager(actor);if(!input.name.trim()||!input.sku.trim()||!input.slug.trim()||!input.categoryId)throw Error('Name, SKU, slug and category are required.');
 for(const [key,value]of Object.entries({price:input.price,mrp:input.mrp,stock:input.stock,costPrice:input.costPrice??0,gstRate:input.gstRate??18}))nonnegative(value,key);
 if((input.gstRate??18)>100)throw Error('GST rate is invalid.');if(input.imageUrl&&!/^(\/(?!\/)|https?:\/\/)/.test(input.imageUrl))throw Error('Use a local image path or HTTP image URL.');
 return transaction(async tx=>{
  const before=id?await tx.product.findUniqueOrThrow({where:{id}}):null;
  if(before&&input.expectedStock===undefined)throw Error('Refresh the product before editing its stock.');
  if(before&&input.expectedStock!==before.stock)throw Error('Stock changed since this edit opened. Refresh and try again.');
  const unit=input.unit||'piece';if(input.stock>0)quantityValid(input.stock,unit);
  if(before&&before.unit!==unit&&before.stock>0)throw Error('Change the unit only after stock is reconciled to zero.');
  const data={name:input.name.trim(),nameML:input.nameML||null,slug:input.slug.trim(),sku:input.sku.trim(),description:input.description||null,descriptionML:input.descriptionML||null,mrp:input.mrp,price:input.price,costPrice:input.costPrice??null,gstRate:input.gstRate??18,unit,stock:input.stock,categoryId:input.categoryId,brandId:input.brandId||null};
  let product;
  if(before){const changed=await tx.product.updateMany({where:{id:before.id,stock:before.stock},data});if(!changed.count)throw Error('Product stock changed. Retry.');product=await tx.product.findUniqueOrThrow({where:{id:before.id}});}
  else product=await tx.product.create({data});
  if(product.stock!==(before?.stock??0))await tx.stockMovement.create({data:{productId:product.id,qty:product.stock-(before?.stock??0),balanceAfter:product.stock,type:before?'adjustment':'opening',reason:before?'Stock changed in product editor':'Opening product stock',userId:actor.id}});
  if(input.imageUrl!==undefined){const main=await tx.productImage.findFirst({where:{productId:product.id},orderBy:{sortOrder:'asc'}});if(input.imageUrl){if(main)await tx.productImage.update({where:{id:main.id},data:{url:input.imageUrl,alt:product.name}});else await tx.productImage.create({data:{productId:product.id,url:input.imageUrl,alt:product.name,sortOrder:0}});}else if(main)await tx.productImage.delete({where:{id:main.id}});}
  await audit(tx,actor,before?'product.update':'product.create',product.id,{sku:product.sku,stock:product.stock,price:product.price});return product;
 });
}
