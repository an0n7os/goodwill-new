import 'dotenv/config';
import fs from 'node:fs';
import { supabaseAdmin as remote } from '../../src/lib/supabase';
const catalog=JSON.parse(fs.readFileSync('src/data/catalog.json','utf8'));
async function main(){
 const ping=await remote.from('Brand').select('id,slug').eq('slug','lisha').maybeSingle();
 if(ping.error)throw Error(ping.error.message);
 let brand=ping.data;
 if(!brand){const source=catalog.brands.find((b:{slug:string})=>b.slug==='lisha');const result=await remote.from('Brand').insert(source).select('id,slug').single();if(result.error)throw Error(result.error.message);brand=result.data;}
 const categories=await remote.from('Category').select('id,slug');if(categories.error)throw Error(categories.error.message);
 const catMap=new Map(categories.data.map(c=>[c.slug,c.id]));
 const selected=catalog.products.filter((p:{sku:string})=>p.sku.startsWith('LISHA-'));
 let total=0;
 for(let i=0;i<selected.length;i+=100){
  const batch=selected.slice(i,i+100);
  const data=batch.map((p:Record<string,unknown>&{category:{slug:string};images:unknown;variants:unknown;brand:unknown})=>{const {category,images,variants,brand:ignored,...fields}=p;void images;void variants;void ignored;return {...fields,categoryId:catMap.get(category.slug),brandId:brand!.id};});
  const saved=await remote.from('Product').upsert(data,{onConflict:'sku'}).select('id,sku');if(saved.error)throw Error(saved.error.message);
  const ids=new Map(saved.data.map(p=>[p.sku,p.id]));
  const images=batch.flatMap((p:{sku:string;images:{id:string;url:string;alt:string;sortOrder:number}[]})=>p.images.map(img=>({...img,productId:ids.get(p.sku)})));
  const imageResult=await remote.from('ProductImage').upsert(images,{onConflict:'id'});if(imageResult.error)throw Error(imageResult.error.message);
  total+=saved.data.length;
 }
 console.log('Remote catalogue verified: '+total+' products synced');
 fs.writeFileSync('imports/lisha-20261030/remote-report.json',JSON.stringify({synced:total,date:new Date().toISOString()},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
