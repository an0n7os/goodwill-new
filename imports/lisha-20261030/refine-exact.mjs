import fs from 'node:fs';
import sharp from 'sharp';
const jobs=JSON.parse(fs.readFileSync('imports/lisha-20261030/exact-images.json','utf8'));
for(const j of jobs){
 let [x,y,w,h]=j.rect;
 if(j.code==='7400'){y=.085;h=.12;}
 if(j.code==='1206'){y=.116;h=.08;}
 const file=fs.readdirSync('C:/Users/aswin/Downloads').find(n=>n.startsWith('IMG_20261030_'+j.page)&&n.endsWith('.jpg'));
 const source=await sharp('C:/Users/aswin/Downloads/'+file).rotate(j.page==='121351267'?0:-90).toBuffer();
 const {width,height}=await sharp(source).metadata();
 await sharp(source).extract({left:Math.round(x*width),top:Math.round(y*height),width:Math.round(w*width),height:Math.round(h*height)}).resize({width:700,height:700,fit:'contain',background:'#ffffff'}).png().toFile('public/products/lisha-exact/'+j.code+'.png');
}
