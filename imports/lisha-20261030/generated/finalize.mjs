import fs from 'node:fs';
import sharp from 'sharp';
const root='imports/lisha-20261030/generated/';
const jobs=JSON.parse(fs.readFileSync(root+fs.readFileSync(root+'latest-checkpoint.txt','utf8').trim(),'utf8')).filter(j=>j.code&&j.sku!=='LISHA-TURBO-CHROME-7803-MATT-BLACK');
if(jobs.some(j=>j.status!=='generated'))throw Error('Main generation still pending; do not finalize');
for(const code of ['2214','9903'])jobs.push(JSON.parse(fs.readFileSync(root+'extra-done-'+code+'.json','utf8')));
jobs.push({code:'9503',sku:'LISHA-TINT-ICON-9503-CARBON-BLACK-MATT-BLACK-BORDER',asset:'/products/lisha-generated/repair-lisha-tint-icon-9503-carbon-black-matt-black-border-v2.png',status:'generated'});
for(const j of jobs){
 const specific='/products/lisha-generated/repair-'+j.sku.toLowerCase()+'-v2.png';
 const repair=fs.existsSync('public'+specific)?specific:'/products/lisha-generated/repair-'+j.code.toLowerCase()+'-v2.png';
 if(fs.existsSync('public'+repair)) {j.asset=repair;j.review='Regenerated against isolated model reference';}
 j.asset=j.asset.replace(/^\/public\//,'/');
 const webp=j.asset.replace(/\.png$/,'.webp');
 await sharp('public'+j.asset).resize({width:1100,height:1100,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toFile('public'+webp);
 j.asset=webp;
}
for(const [from,to] of [['1801','1802'],['2006','2007'],['8009','8010'],['8018','8019'],['4036','4037']]){
 const source=jobs.find(j=>j.code===from);if(!source)throw Error(from);
 jobs.push({...source,code:to,sku:source.sku.replace(new RegExp(from+'(?=-|$)'),to),review:'Catalogue explicitly labels the same photograph with both model codes'});
}
const inside='/products/lisha-generated/repair-7604-inside-v2';
if(fs.existsSync('public'+inside+'.png'))await sharp('public'+inside+'.png').resize({width:1100,height:1100,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toFile('public'+inside+'.webp');
fs.writeFileSync(root+'final-manifest.json',JSON.stringify(jobs,null,2));
fs.writeFileSync(root+'latest-checkpoint.txt','final-manifest.json');
console.log(jobs.length+' photographed-model mappings finalized');
