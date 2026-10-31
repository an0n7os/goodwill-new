import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const before=await db.productImage.findMany();
 const products=await db.product.count();
 const references=before.filter(i=>i.url.startsWith('/products/lisha-catalogue/'));
 const retained=before.filter(i=>!i.url.startsWith('/products/lisha-catalogue/'));
 fs.writeFileSync('imports/lisha-20261030/removed-reference-image-links.json',JSON.stringify(references,null,2));
 await db.productImage.deleteMany({where:{url:{startsWith:'/products/lisha-catalogue/'}}});
 const after=await db.productImage.findMany();const ids=new Set(after.map(i=>i.id));
 if(retained.some(i=>!ids.has(i.id))||await db.product.count()!==products)throw Error('Preservation check failed');
 console.log({removedReferenceLinks:references.length,remainingImages:after.length,studioLinks:after.filter(i=>i.url.includes('/lisha-generated/')).length,productsPreserved:products});
}
main().finally(()=>db.$disconnect());
