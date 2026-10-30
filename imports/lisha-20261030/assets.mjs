import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const rows=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
const sources=[...new Set(rows.map(r=>r.page))];
for(const page of sources){
 const candidates=fs.readdirSync('C:/Users/aswin/Downloads').filter(n=>n.startsWith('IMG_20261030_'+page)&&n.endsWith('.jpg'));
 if(candidates.length!==1) throw Error('Source missing or ambiguous: '+page);
 const source=path.join('C:/Users/aswin/Downloads',candidates[0]);
 // Documentary page reference, preserving every photographed product and printed rate.
 await sharp(source).rotate(page==='121358014'?180:page==='121351267'?0:-90).resize({width:1600,withoutEnlargement:true}).jpeg({quality:88}).toFile('public/products/lisha-catalogue/'+page+'.jpg');
}
fs.writeFileSync('imports/lisha-20261030/source-manifest.json',JSON.stringify({sourceCount:23,uniquePricedPages:sources,notes:['Duplicate photos merged by series and code.','Dimension-only pages 121619366, 121608786, 121553843, 121528594 are retained as supplied references; they do not introduce separate priced SKUs.','Catalogue-page photographs used as documentary image references, not isolated product photographs.','Printed MRP used as temporary demo selling price as instructed.','Stock is unconfirmed and is not inferred from pack quantity.']},null,2));
console.log('Verified '+sources.length+' image references');
