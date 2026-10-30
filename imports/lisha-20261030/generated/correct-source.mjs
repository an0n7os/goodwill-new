import fs from 'node:fs';
import sharp from 'sharp';
for(const page of ['121407490','121419046']){
 const target='public/products/lisha-catalogue/'+page+'.jpg';
 const meta=await sharp(target).metadata();
 if(meta.height>meta.width){const corrected=await sharp(target).rotate(90).toBuffer();fs.writeFileSync(target,corrected);}
}
const file='imports/lisha-20261030/products.json';const rows=JSON.parse(fs.readFileSync(file,'utf8'));
for(const p of rows){if(p.page==='121632062'&&p.code==='2204')p.mrp=405;if(p.page==='121632062'&&p.code==='2205')p.mrp=360;}
fs.writeFileSync(file,JSON.stringify(rows,null,2));
const qfile='imports/lisha-20261030/generated/remaining-photographed.json';const jobs=JSON.parse(fs.readFileSync(qfile,'utf8'));for(const j of jobs){if(j.code==='2204')j.price=405;if(j.code==='2205')j.price=360;}fs.writeFileSync(qfile,JSON.stringify(jobs,null,2));
