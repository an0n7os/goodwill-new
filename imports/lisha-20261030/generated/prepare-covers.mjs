import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
const jobs=JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/remaining-photographed.json','utf8'));
for(const [page,series] of [['121515180','Platina'],['121521764','Platina Icon'],['121559189','Turbo'],['121603764','Turbo Chrome'],['121535205','Tint'],['121549133','Tint Icon'],['121616124','Wood Craft']]) {
 for(const p of rows.filter(p=>p.page===page&&p.series===series&&p.specs.Module==='3M')){
 jobs.push({code:p.specs['Catalogue code'],sourcePage:page,reference:`C:/Users/aswin/Downloads/goodwill new/public/products/lisha-catalogue/${page}.jpg`,name:p.name,sku:('LISHA-'+p.series+'-'+p.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-'),price:p.mrp,status:'pending',hint:'Use the pictured 3-module cover plate with this exact finish. Photograph only the cover plate, preserving its outline, bezel, finish and the pictured insert openings. Do not invent a different decorative border or frame. The printed model table identifies module codes; the finish label identifies the exact matching photo.'});
 }
}
const p=rows.find(p=>p.series==='Super Plate'&&p.code==='4545');jobs.push({code:'4545',sourcePage:p.page,reference:`C:/Users/aswin/Downloads/goodwill new/public/products/lisha-catalogue/${p.page}.jpg`,name:p.name,sku:'LISHA-SUPER-PLATE-4545',price:p.mrp,status:'pending',hint:'Use only the large pictured square white super plate. Preserve the square opening and rounded outer edges; no switch mechanisms.'});
fs.writeFileSync('imports/lisha-20261030/generated/remaining-photographed.json',JSON.stringify(jobs,null,2));console.log(jobs.length+' source-photo model/finish jobs inventoried');
