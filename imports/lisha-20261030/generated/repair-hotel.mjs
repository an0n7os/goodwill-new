import sharp from 'sharp';
for(const [code,x,y,w,h] of [['7601WH',.069,.382,.082,.068],['7606WH',.159,.381,.113,.068],['7607WH',.067,.545,.163,.068],['7608WH',.258,.515,.143,.11],['7604-inside',.22,.708,.088,.067],['7604',.317,.711,.112,.068]]){
 const im=sharp('public/products/lisha-catalogue/121442197.jpg');const {width,height}=await im.metadata();
 await im.extract({left:Math.round(x*width),top:Math.round(y*height),width:Math.round(w*width),height:Math.round(h*height)}).resize(700,700,{fit:'contain',background:'white'}).png().toFile('imports/lisha-20261030/generated/reference-'+code+'.png');
}
