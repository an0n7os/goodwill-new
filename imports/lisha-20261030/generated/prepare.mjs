import fs from 'node:fs';
const crops=JSON.parse(fs.readFileSync('imports/lisha-20261030/exact-images.json','utf8'));
const products=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
const jobs=crops.map(j=>{const p=products.find(p=>p.specs?.['Catalogue code']===j.code&&p.specs.Finish==='Graphite Grey')??products.find(p=>p.code===j.code);if(!p)throw Error(j.code);return {code:j.code,sourcePage:j.page,reference:'C:/Users/aswin/Downloads/IMG_20261030_'+j.page+'.jpg',name:p.name,sku:('LISHA-'+p.series+'-'+p.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-'),price:p.mrp,status:'pending'};});
fs.writeFileSync('imports/lisha-20261030/generated/queue.json',JSON.stringify(jobs,null,2));console.log(jobs.length+' exact model jobs queued');
