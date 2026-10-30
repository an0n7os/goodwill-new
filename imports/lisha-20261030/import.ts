import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
const local=path.resolve('dev.db');
const db=new PrismaClient({adapter:new PrismaLibSql({url:'file:'+local.replaceAll('\\','/')})});
const rows: {page:string;series:string;code:string;name:string;mrp:number;specs:Record<string,string>}[]=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
async function main(){
 if(!fs.existsSync('imports/lisha-20261030/dev-before-import.db')) fs.copyFileSync(local,'imports/lisha-20261030/dev-before-import.db');
 const brand=await db.brand.upsert({where:{slug:'lisha'},update:{},create:{name:'Lisha',slug:'lisha'}});
 const parent=await db.category.upsert({where:{slug:'electrical'},update:{},create:{name:'Electrical',slug:'electrical'}});
 const categories=new Map<string,string>();
 for(const [slug,name] of [['switches-sockets','Switches & Sockets'],['door-bells','Door Bells'],['extension-boards','Extension Boards'],['holders-accessories','Holders & Accessories']]) {const c=await db.category.upsert({where:{slug},update:{},create:{slug,name,parentId:parent.id}});categories.set(slug,c.id);}
 const seen=new Set<string>();let created=0;let updated=0;
 for(const r of rows){
  const sku=('LISHA-'+r.series+'-'+r.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-');
  if(seen.has(sku)) throw Error('Duplicate SKU '+sku);seen.add(sku);
  if(!Number.isFinite(r.mrp)||r.mrp<=0) throw Error('Invalid price '+sku);
  const category=/bell|buzzer/i.test(r.name)?'door-bells':/power strip|spike guard|extension board/i.test(r.name)?'extension-boards':/holder|ceiling rose/i.test(r.name)?'holders-accessories':'switches-sockets';
  const slug=sku.toLowerCase();const existing=await db.product.findUnique({where:{sku}});
  const specs=JSON.stringify({...r.specs,Brand:'Lisha',Series:r.series,'Model code':r.specs['Catalogue code']??r.code,'Pricing':'Printed catalogue MRP used as editable demo selling price','Availability':'Contact showroom to confirm stock','Image reference':'Photographed catalogue page; multiple products may be shown'});
  const data={name:r.name,mrp:r.mrp,price:r.mrp,description:`${r.name}. Model ${r.specs['Catalogue code']??r.code}, from the supplied Lisha catalogue. Refer to the catalogue image and specifications for identification. Listed price is a temporary demo rate based on the printed MRP; confirm current price and availability with Goodwill.`,specs,categoryId:categories.get(category)!,brandId:brand.id};
  const product=await db.product.upsert({where:{sku},update:data,create:{...data,sku,slug,stock:0,trackStock:true,unit:'piece',isActive:true}});
  const url='/products/lisha-catalogue/'+r.page+'.jpg';
  const image=await db.productImage.findFirst({where:{productId:product.id,url}});
  if(!image) await db.productImage.create({data:{productId:product.id,url,alt:`Lisha ${r.series} catalogue reference — ${r.specs['Catalogue code']??r.code}`,sortOrder:0}});
  if(existing)updated++;else created++;
 }
 const verified=await db.product.findMany({where:{sku:{in:[...seen]}},include:{images:true}});
 if(verified.length!==rows.length||verified.some(p=>!p.images.length||p.price!==p.mrp))throw Error('Import verification failed');
 fs.writeFileSync('imports/lisha-20261030/import-report.json',JSON.stringify({created,updated,verified:verified.length,stock:'Unconfirmed, initialized to zero for new products',database:'Local dev.db',sources:'Original JPGs unchanged'},null,2));
 console.log({created,updated,verified:verified.length});
}
main().finally(()=>db.$disconnect());
