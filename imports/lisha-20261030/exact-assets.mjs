import sharp from 'sharp';
import fs from 'node:fs';
fs.mkdirSync('public/products/lisha-exact',{recursive:true});
const jobs=[];
function add(page,code,rect){jobs.push({page,code,rect});}
// Coordinates refer to the supplied photograph, not a generated reconstruction.
for(const [code,rect] of Object.entries({7400:[.135,.075,.09,.13],7406:[.23,.072,.085,.13],7402:[.327,.074,.085,.13],7407:[.133,.257,.085,.13],7408:[.23,.256,.085,.13],7410:[.328,.252,.095,.135],4900:[.13,.575,.085,.14],4906:[.226,.575,.09,.14],4902:[.327,.575,.09,.14],4907:[.125,.776,.09,.135],4908:[.225,.775,.09,.14],4910:[.32,.775,.105,.14]})) add('121351267',code,rect);
for(const [code,rect] of Object.entries({1206:[.185,.11,.12,.095],1207:[.31,.12,.1,.085],4023:[.07,.27,.08,.07],4024:[.16,.27,.085,.07],4118:[.257,.266,.075,.074],4119:[.343,.262,.08,.08],4041:[.065,.425,.095,.075],4042:[.167,.425,.095,.075],4043:[.267,.425,.105,.075],4117:[.064,.587,.07,.082],7927:[.152,.587,.1,.085],7929:[.268,.588,.1,.085],4044:[.056,.744,.105,.077],4045:[.164,.745,.12,.08],4046:[.281,.745,.12,.08]}))add('121642406',code,rect);
for(const j of jobs){const source='public/products/lisha-catalogue/'+j.page+'.jpg';const {width,height}=await sharp(source).metadata();const [x,y,w,h]=j.rect;await sharp(source).extract({left:Math.round(x*width),top:Math.round(y*height),width:Math.round(w*width),height:Math.round(h*height)}).resize({width:600,height:600,fit:'contain',background:'#ffffff'}).png().toFile('public/products/lisha-exact/'+j.code+'.png');}
fs.writeFileSync('imports/lisha-20261030/exact-images.json',JSON.stringify(jobs,null,2));console.log('Extracted '+jobs.length+' exact catalogue photos. No generative alterations.');
