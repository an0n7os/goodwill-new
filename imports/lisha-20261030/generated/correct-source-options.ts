import {PrismaClient} from '@prisma/client';import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function main(){
 const products=await db.product.findMany({where:{sku:{startsWith:'LISHA-'}}});let corrected=0;
 for(const p of products){
  const specs=JSON.parse(p.specs||'{}');
  const unsupportedChrome=p.sku.startsWith('LISHA-TURBO-CHROME-')&&specs.Finish==='Matt Black';
  const unavailableSlimz=p.sku.startsWith('LISHA-SLIMZ-74')&&specs.Finish==='Matt Black';
  if(unsupportedChrome||unavailableSlimz){await db.product.update({where:{id:p.id},data:{isActive:false,specs:JSON.stringify({...specs,'Catalogue note':unsupportedChrome?'This finish is not pictured or listed for this series in the supplied catalogue.':'Catalogue footnote: Matt black not available.'})}});corrected++;}
 }
 console.log('Withheld '+corrected+' unsupported or source-unavailable finish options');
}
main().finally(()=>db.$disconnect());
