import fs from 'node:fs';
import sharp from 'sharp';
const jobs=JSON.parse(fs.readFileSync('imports/lisha-20261030/generated/progress.json','utf8')).filter(j=>j.status==='generated');
const tiles=[];let i=0;
for(const j of jobs){const asset=j.asset.replace(/^\/public\//,'/');const thumb=await sharp('public'+asset).resize(210,210,{fit:'contain',background:'white'}).toBuffer();tiles.push({input:thumb,left:(i%5)*220,top:Math.floor(i/5)*240});const label=Buffer.from(`<svg width="210" height="25"><text x="105" y="18" text-anchor="middle" font-size="16">${j.code}</text></svg>`);tiles.push({input:label,left:(i%5)*220,top:Math.floor(i/5)*240+210});i++;}
await sharp({create:{width:1100,height:Math.ceil(i/5)*240,channels:3,background:'white'}}).composite(tiles).jpeg().toFile('imports/lisha-20261030/generated/review.jpg');console.log(i+' asset review');
