import sharp from 'sharp';
for(const [finish,x,y,w,h] of [['classic-white',.042,.102,.196,.114],['intel-ivory',.274,.098,.2,.117]]){
 const im=sharp('public/products/lisha-catalogue/121603764.jpg');const {width,height}=await im.metadata();
 await im.extract({left:Math.round(x*width),top:Math.round(y*height),width:Math.round(w*width),height:Math.round(h*height)}).resize(700,700,{fit:'contain',background:'white'}).png().toFile('imports/lisha-20261030/generated/reference-chrome-'+finish+'.png');
}
