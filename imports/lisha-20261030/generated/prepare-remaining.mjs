import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('imports/lisha-20261030/products.json','utf8'));
const photographed={
 '121358014':['7000','7006','7002','7007','7008','7010'],
 '121407490':['9000','9006','9002','9007','9008','9010'],
 '121419046':['7011A','7015','7048','7016','7017','7018','7019','7020','7038','7047'],
 '121423671':['7417','7418','7419','7421','7021','7022','7023','7024','7025','7026','7027','7028','7029','7030'],
 '121442197':['7033','7035','7044','7046','7601WH','7606WH','7607WH','7608WH','7602','7603','7604'],
 '121638511':['1801','1105','2002','2003','2004','2005','1901','1902','3011','2006','2102','4033','2103','1203','1205'],
 '121632062':['8021','8022','8023','8024','8025','2202','2203','2204','2205','2208','1001','1002','1003','1004','1005','1006','1102A','1501','1502','1503','1506','1601','1603','1604','1602','1706'],
 '121627162':['8002','8005','8009','8011','8018','8020','4035','4036','4038','4040'],
 '121454729':['7208','9308','9208','7308'],
};
const jobs=[];
for(const [page,codes] of Object.entries(photographed))for(const code of codes){
 const p=rows.find(p=>p.page===page&&(p.specs['Catalogue code']===code&&p.specs.Finish==='Graphite Grey'))??rows.find(p=>p.page===page&&p.code===code);
 if(!p)throw Error('Missing source row '+code);
 jobs.push({code,sourcePage:page,reference:`C:/Users/aswin/Downloads/goodwill new/public/products/lisha-catalogue/${page}.jpg`,name:p.name,sku:('LISHA-'+p.series+'-'+p.code).toUpperCase().replace(/[^A-Z0-9]+/g,'-'),price:p.mrp,status:'pending'});
}
fs.writeFileSync('imports/lisha-20261030/generated/remaining-photographed.json',JSON.stringify(jobs,null,2));console.log(jobs.length+' additional photographed models inventoried');
