import fs from 'node:fs';
import sharp from 'sharp';
for(const page of ['121515180','121559189','121603764','121535205','121549133']) {
 const file='public/products/lisha-catalogue/'+page+'.jpg';
 if(!fs.existsSync(file+'.upright')) {const result=await sharp(file).rotate(180).toBuffer();fs.writeFileSync(file,result);fs.writeFileSync(file+'.upright','corrected');}
}
