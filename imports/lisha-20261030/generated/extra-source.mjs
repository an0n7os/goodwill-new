import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
const additions=rows.filter(p=>p.series==='Platina Icon'&&p.specs.Finish==='Matt Black').map(p=>({...p,code:p.code.replace('matt-black','graphite-grey'),name:p.name.replace('Matt Black','Graphite Grey'),specs:{...p.specs,Finish:'Graphite Grey'}}));
const p=additions.find(p=>p.specs.Module==='3M');
const jobs=[{code:p.specs['Catalogue code'],sourcePage:p.page,reference:`C:/Users/aswin/Downloads/goodwill new/public/products/lisha-catalogue/${p.page}.jpg`,name:p.name,sku:('LISHA-'+p.series+'-'+p.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-'),price:p.mrp,status:'pending',hint:'Select the actual Graphite Grey metallic finish photo, NOT Graphite Ivory and NOT Matt Black. Preserve the photographed Platina Icon border.'}];
fs.writeFileSync('imports/lisha-20261030/generated/extra-source-rows.json',JSON.stringify(additions,null,2));
fs.writeFileSync('imports/lisha-20261030/generated/extra-source-jobs.json',JSON.stringify(jobs,null,2));
