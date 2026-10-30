import fs from 'node:fs';
const first=JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/queue.json','utf8'));
const rest=JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/remaining-photographed.json','utf8'));
const old=JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/progress.json','utf8'));
const jobs=[...first,...rest].map(j=>{
 const path='/products/lisha-generated/'+j.sku.toLowerCase()+'.png';const v2=path.replace('.png','-v2.png');
 const asset=fs.existsSync('public'+v2)?v2:fs.existsSync('public'+path)?path:undefined;
 return {...j,...old.find(o=>o.sku===j.sku),reference:`C:/Users/aswin/Downloads/goodwill new/public/products/lisha-catalogue/${j.sourcePage}.jpg`,asset,status:asset?'generated':'pending'};
});
fs.writeFileSync('imports/lisha-20261030/generated/progress.json',JSON.stringify(jobs,null,2));
console.log({total:jobs.length,generated:jobs.filter(j=>j.status==='generated').length,pending:jobs.filter(j=>j.status==='pending').length});
