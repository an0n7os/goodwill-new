import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
const db = new PrismaClient({ adapter: new PrismaLibSql({ url: 'file:./dev.db' }) });
async function main() {
 const root = 'imports/lisha-20261030/generated/';
 const checkpoint = fs.existsSync(root + 'latest-checkpoint.txt') ? root + fs.readFileSync(root + 'latest-checkpoint.txt', 'utf8').trim() : root + 'progress.json';
 const jobs: {sku:string;code:string;asset?:string;status:string}[]=JSON.parse(fs.readFileSync(checkpoint,'utf8'));
 const firstBatch: {sku:string;code:string;asset?:string;status:string}[] = JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/queue.json','utf8'));
 for (const job of firstBatch) {
  const asset = '/products/lisha-generated/' + job.sku.toLowerCase() + '.png';
  if (!jobs.some(existing => existing.sku === job.sku) && fs.existsSync('public' + asset)) {
   jobs.push({ ...job, asset, status: 'generated' });
  }
 }
 let mapped=0;
 for (const job of jobs.filter(j=>j.status==='generated')) {
  job.asset = job.asset?.replace(/^\/public\//, '/');
  if(!job.asset || !fs.existsSync('public'+job.asset))throw Error('Missing asset '+job.code);
  const product=await db.product.findUnique({where:{sku:job.sku}});
  if(!product)throw Error('Missing product '+job.sku);
  await db.productImage.updateMany({where:{productId:product.id},data:{sortOrder:20}});
  const existing=await db.productImage.findFirst({where:{productId:product.id,url:job.asset}});
  if(existing)await db.productImage.update({where:{id:existing.id},data:{sortOrder:0}});
  else await db.productImage.create({data:{productId:product.id,url:job.asset,sortOrder:0,alt:product.name+' — catalogue-based product image'}});
  mapped++;
 }
 const hotel=await db.product.findUnique({where:{sku:'LISHA-S7-7604'}});
 const inside='/products/lisha-generated/repair-7604-inside-v2.webp';
 if(hotel&&fs.existsSync('public'+inside)) {
  const existing=await db.productImage.findFirst({where:{productId:hotel.id,url:inside}});
  if(existing)await db.productImage.update({where:{id:existing.id},data:{sortOrder:1}});
  else await db.productImage.create({data:{productId:hotel.id,url:inside,sortOrder:1,alt:'Lisha 7604 inside-room 2M indicator unit'}});
 }
 console.log('Generated images connected to '+mapped+' matching products');
}
main().finally(()=>db.$disconnect());
