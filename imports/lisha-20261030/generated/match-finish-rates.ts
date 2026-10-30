import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const rows=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
 let count=0;
 for(const r of rows){
  if(!['121419046','121423671','121442197'].includes(r.page))continue;
  const other=r.specs['Graphite Grey / Matt Black MRP'];if(!other)continue;
  const sku=('LISHA-'+r.series+'-'+r.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-');
  const product=await db.product.findUnique({where:{sku}});if(!product)throw Error(sku);
  const specs={...JSON.parse(product.specs??'{}'),'Classic White MRP':'₹'+r.mrp,Finish:'Graphite Grey'};
  const name=r.name+' — Graphite Grey';const price=Number(other.replace(/[^0-9.]/g,''));
  await db.product.update({where:{sku},data:{name,description:name,price,mrp:price,specs:JSON.stringify(specs)}});count++;
 }
 console.log(count+' pictured graphite models matched to the graphite MRP column');
}
main().finally(()=>db.$disconnect());
