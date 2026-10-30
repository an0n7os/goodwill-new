import sharp from 'sharp';
const base='public/products/lisha-catalogue/';
for(const [code,page,x,y,w,h] of [['7419','121423671',.245,.116,.045,.12],['7026','121423671',.116,.66,.08,.117],['7019','121419046',.225,.475,.047,.124]]) {
 const im=sharp(base+page+'.jpg'); const {width,height}=await im.metadata();
 await im.extract({left:Math.round(x*width),top:Math.round(y*height),width:Math.round(w*width),height:Math.round(h*height)}).resize(700,700,{fit:'contain',background:'white'}).png().toFile('imports/lisha-20261030/generated/reference-'+code+'.png');
}

