import fs from 'node:fs';import sharp from 'sharp';
import {PrismaClient} from '@prisma/client';import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const root='imports/lisha-20261030/generated/';
 const jobs: {sku:string;asset:string}[]=JSON.parse(fs.readFileSync(root+'final-manifest.json','utf8'));
 const mappings=[];const assets=new Set<string>();
 for(const j of jobs){
  const p=await db.product.findUniqueOrThrow({where:{sku:j.sku},include:{images:{orderBy:{sortOrder:'asc'}}}});
  if(!p.isActive||p.images[0]?.url!==j.asset)throw Error('Main image mismatch '+j.sku);
  if(!p.name||p.price<=0||p.mrp<=0||!p.specs)throw Error('Missing source details '+j.sku);
  const meta=await sharp('public'+j.asset).metadata();if(!meta.width||!meta.height||Math.min(meta.width,meta.height)<256||Math.max(meta.width,meta.height)<800)throw Error('Invalid product image '+j.asset);
  assets.add(j.asset);mappings.push({sku:p.sku,name:p.name,price:p.price,mrp:p.mrp,url:j.asset});
 }
 const hotel=await db.product.findUniqueOrThrow({where:{sku:'LISHA-S7-7604'},include:{images:true}});
 if(!hotel.images.some(i=>i.url.includes('7604-inside-v2.webp')))throw Error('Missing hotel inside view');
 assets.add('/products/lisha-generated/repair-7604-inside-v2.webp');
 const report={standaloneImages:assets.size,photographedModelMappings:mappings.length,activeProducts:await db.product.count({where:{isActive:true}}),sourceOnlyOptions:await db.product.count({where:{isActive:true,sku:{startsWith:'LISHA-'},images:{none:{url:{contains:'lisha-generated'}}}}}),scope:'Local dev.db and public image assets; remote publication not verified',mappings};
 fs.writeFileSync(root+'verification-report.json',JSON.stringify(report,null,2));console.log({...report,mappings:undefined});
}
main().finally(()=>db.$disconnect());
