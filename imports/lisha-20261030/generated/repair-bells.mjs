import sharp from 'sharp';
for(const [code,page,x,y,w,h] of [['8018','121627162',.028,.524,.171,.105],['8020','121627162',.223,.538,.147,.109],['8022','121632062',.221,.105,.055,.078],['2203','121632062',.19,.25,.053,.061],['2204','121632062',.25,.25,.052,.061],['2208','121632062',.375,.247,.056,.064]]) {
 const im=sharp('public/products/lisha-catalogue/'+page+'.jpg'); const {width,height}=await im.metadata();
 await im.extract({left:Math.round(x*width),top:Math.round(y*height),width:Math.round(w*width),height:Math.round(h*height)}).resize(700,700,{fit:'contain',background:'white'}).png().toFile('imports/lisha-20261030/generated/reference-'+code+'.png');
}
