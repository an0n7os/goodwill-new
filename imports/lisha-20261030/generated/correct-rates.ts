import {PrismaClient} from '@prisma/client';
import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 for(const [sku,price] of [['LISHA-HOT-STAR-2204',405],['LISHA-HOT-STAR-2205',360]] as const)await db.product.update({where:{sku},data:{price,mrp:price}});
 console.log('Two doorbell rates reconciled against the printed source.');
}
main().finally(()=>db.$disconnect());
