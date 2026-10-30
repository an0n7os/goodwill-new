import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const jobs:{code:string;page:string}[]=JSON.parse(fs.readFileSync('imports/lisha-20261030/exact-images.json','utf8'));
 let mapped=0;
 for(const j of jobs){
  const sku=Number(j.code)>=4900&&Number(j.code)<=4910?'LISHA-SLIMZ-ICON-'+j.code+'-GRAPHITE-GREY':Number(j.code)>=7400&&Number(j.code)<=7410?'LISHA-SLIMZ-'+j.code+'-GRAPHITE-GREY':'LISHA-HOT-STAR-'+j.code;
  const p=await db.product.findUnique({where:{sku}});if(!p)throw Error('Missing '+sku);
  await db.productImage.updateMany({where:{productId:p.id},data:{sortOrder:10}});
  const url='/products/lisha-exact/'+j.code+'.png';
  const existing=await db.productImage.findFirst({where:{productId:p.id,url}});
  if(!existing)await db.productImage.create({data:{productId:p.id,url,alt:p.name+' — exact catalogue photograph',sortOrder:0}});
  mapped++;
 }
 // Remove previously added marketing/demo prose. Keep only the supplied table information.
 const products=await db.product.findMany({where:{sku:{startsWith:'LISHA-'}}});
 for(const p of products){const specs=JSON.parse(p.specs??'{}');delete specs.Pricing;delete specs.Availability;delete specs['Image reference'];await db.product.update({where:{id:p.id},data:{description:p.name,specs:JSON.stringify(specs)}});}
 fs.writeFileSync('imports/lisha-20261030/exact-report.json',JSON.stringify({exactPhotosMapped:mapped,generatedImagesUsed:0,remainingRows:'Await exact source-image extraction and source detail audit'},null,2));console.log({exactPhotosMapped:mapped,generatedImagesUsed:0});
}
main().finally(()=>db.$disconnect());
