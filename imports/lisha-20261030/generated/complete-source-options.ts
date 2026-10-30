import {PrismaClient} from '@prisma/client';import {PrismaLibSql} from '@prisma/adapter-libsql';
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:./dev.db'})});
async function clone(p:Awaited<ReturnType<typeof db.product.findFirstOrThrow>>,sku:string,name:string,specs:object,price=p.price,page='121549133'){
 const product=await db.product.upsert({where:{sku},update:{},create:{sku,slug:sku.toLowerCase(),name,description:name,price,mrp:price,specs:JSON.stringify(specs),stock:0,trackStock:true,unit:'piece',isActive:true,brandId:p.brandId,categoryId:p.categoryId}});
 const url='/products/lisha-catalogue/'+page+'.jpg';if(!await db.productImage.findFirst({where:{productId:product.id,url}}))await db.productImage.create({data:{productId:product.id,url,sortOrder:20,alt:name+' — catalogue reference'}});
}
async function main(){
 const rows=await db.product.findMany({where:{sku:{startsWith:'LISHA-TINT-ICON-95'},name:{endsWith:'Carbon Black'}}});
 for(const p of rows)await clone(p,p.sku+'-MATT-BLACK-BORDER',p.name+' (Matt Black Border)',{...JSON.parse(p.specs||'{}'),Finish:'Carbon Black (Matt Black Border)'});
 const template=await db.product.findFirstOrThrow({where:{sku:'LISHA-S7-7000-GRAPHITE-GREY'}});
 for(const [code,amp,white,grey] of [['7049','10A',393,413],['7050','20A',511,529]] as const){
  for(const finish of ['Classic White','Graphite Grey','Matt Black']){
   const sku='LISHA-S7-'+code+'-'+finish.toUpperCase().replaceAll(' ','-');
   await clone(template,sku,`Lisha S7 ${amp} 2 Way Switch — ${finish}`,{Brand:'Lisha',Series:'S7','Model code':code,'Catalogue code':code,Module:'2M',Finish:finish,Rating:amp,'Rated voltage':'240V AC'},finish==='Classic White'?white:grey,'121358014');
  }
 }
 const hotel=await db.product.findUniqueOrThrow({where:{sku:'LISHA-S7-7604'}});
 await db.product.update({where:{id:hotel.id},data:{specs:JSON.stringify({...JSON.parse(hotel.specs||'{}'),'Inside room':'2M DND / Make My Room indicator unit','Outside room':'3M unit with 2 switches and doorbell cut-off wiring','Rated voltage':'240V AC, 50–60Hz','Frame':'Catalogue prices exclude frames'})}});
 console.log('Source-listed border options and missing 2M switch codes added');
}
main().finally(()=>db.$disconnect());
