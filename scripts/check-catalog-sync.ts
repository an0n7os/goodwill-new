import 'dotenv/config';
import assert from 'node:assert/strict';
import {db} from '../src/lib/db';
import {readProducts, readProduct} from '../src/lib/liveCatalog';
async function main(){
 const category=await db.category.findFirstOrThrow({where:{isActive:true}});
 const sku='SYNC-CHECK-'+Date.now();
 const product=await db.product.create({data:{sku,slug:sku.toLowerCase(),name:'Sync verification temporary product',categoryId:category.id,price:123,mrp:200,costPrice:51,stock:2,isActive:true,images:{create:{url:'/sync-before.png',sortOrder:0}}}});
 try {
  assert.equal((await readProduct(product.slug))?.price,123);
  await db.product.update({where:{id:product.id},data:{name:'Updated sync verification',price:157,stock:8}});
  await db.productImage.updateMany({where:{productId:product.id},data:{url:'/sync-after.png'}});
  const detail=await readProduct(product.slug);const list=await readProducts({search:sku});
  assert.equal(detail?.price,157);assert.equal(detail?.stock,8);assert.equal(detail?.name,'Updated sync verification');assert.equal(detail?.images[0].url,'/sync-after.png');assert.equal(list[0]?.price,157);assert.equal('costPrice' in detail!,false);
  assert.equal((await readProducts({search:sku,minPrice:158})).length,0);
  await db.product.update({where:{id:product.id},data:{isActive:false}});
  assert.equal(await readProduct(product.slug),null);assert.equal((await readProducts({search:sku})).length,0);
  await db.product.delete({where:{id:product.id}});assert.equal(await readProduct(product.slug),null);
  console.log('PASS: database edits to name/price/stock/image reach listing and detail immediately; hide/delete do not revive snapshot rows; private cost excluded.');
 } finally {await db.product.deleteMany({where:{id:product.id}});}
}
main().finally(()=>db.$disconnect());
