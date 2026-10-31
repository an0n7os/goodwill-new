import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const links: {productId:string}[]=JSON.parse(fs.readFileSync('imports/lisha-20261030/removed-reference-image-links.json','utf8'));
 const sourceIds=new Set(links.map(i=>i.productId));
 const all=await db.product.findMany({include:{images:true,variants:true,_count:{select:{orderItems:true,stockMovements:true}}}});
 const targets=all.filter(p=>sourceIds.has(p.id)&&p.sku.startsWith('LISHA-')&&p.images.length===0);
 const protectedRows=all.filter(p=>!targets.some(t=>t.id===p.id));
 const unsafe=targets.filter(p=>p._count.orderItems||p._count.stockMovements||p.variants.length);
 if(unsafe.length)throw Error('Linked business records need preservation: '+unsafe.map(p=>p.sku).join(','));
 fs.writeFileSync('imports/lisha-20261030/removed-empty-products-backup.json',JSON.stringify(targets,null,2));
 for(const p of targets)await db.product.delete({where:{id:p.id}});
 const after=await db.product.findMany({include:{images:true}});const remaining=new Map(after.map(p=>[p.id,p]));
 if(protectedRows.some(p=>!remaining.has(p.id)||remaining.get(p.id)!.images.length!==p.images.length))throw Error('Preservation mismatch');
 console.log({deletedEmptyCatalogueProducts:targets.length,remainingProducts:after.length,protectedProductsVerified:protectedRows.length,studioProductsPreserved:after.filter(p=>p.images.some(i=>i.url.includes('/lisha-generated/'))).length});
}
main().finally(()=>db.$disconnect());
