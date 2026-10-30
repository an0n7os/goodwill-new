import fs from 'node:fs';import sharp from 'sharp';
const files=fs.readdirSync('public/products/lisha-generated').filter(f=>f.startsWith('repair-')&&f.endsWith('.png'));const tiles=[];
for(let i=0;i<files.length;i++){
 const name=files[i];tiles.push({input:await sharp('public/products/lisha-generated/'+name).resize(210,210,{fit:'contain',background:'white'}).toBuffer(),left:(i%5)*220,top:Math.floor(i/5)*240});
 tiles.push({input:Buffer.from(`<svg width="210" height="25"><text x="105" y="18" text-anchor="middle" font-size="16">${name.replace('repair-','').replace('-v2.png','')}</text></svg>`),left:(i%5)*220,top:Math.floor(i/5)*240+210});
}await sharp({create:{width:1100,height:Math.ceil(files.length/5)*240,channels:3,background:'white'}}).composite(tiles).jpeg().toFile('imports/lisha-20261030/generated/review-repairs.jpg');
