import sharp from 'sharp';
for(const [code,x] of [['1003',.224],['1004',.273],['1005',.321],['1006',.369]]){
 const im=sharp('public/products/lisha-catalogue/121632062.jpg');const {width,height}=await im.metadata();
 await im.extract({left:Math.round(x*width),top:Math.round(.402*height),width:Math.round(.044*width),height:Math.round(.067*height)}).resize(700,700,{fit:'contain',background:'white'}).png().toFile('imports/lisha-20261030/generated/reference-'+code+'.png');
}
