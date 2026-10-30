import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const rows=JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/extra-source-rows.json','utf8'));
 const template=await db.product.findFirstOrThrow({where:{sku:'LISHA-PLATINA-ICON-9903-MATT-BLACK'}});
 for(const r of rows){
  const sku=('LISHA-'+r.series+'-'+r.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-');
  const p=await db.product.upsert({where:{sku},update:{},create:{sku,slug:sku.toLowerCase(),name:r.name,description:r.name,price:r.mrp,mrp:r.mrp,specs:JSON.stringify({...r.specs,Brand:'Lisha',Series:r.series}),stock:0,trackStock:true,unit:'piece',isActive:true,categoryId:template.categoryId,brandId:template.brandId}});
  const url='/products/lisha-catalogue/'+r.page+'.jpg';
  if(!await db.productImage.findFirst({where:{productId:p.id,url}}))await db.productImage.create({data:{productId:p.id,url,sortOrder:20,alt:r.name+' — catalogue reference'}});
 }
 console.log('Imported '+rows.length+' source-listed Graphite Grey options');
}
main().finally(()=>db.$disconnect());
