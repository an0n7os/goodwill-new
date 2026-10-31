import fs from 'node:fs/promises';import sharp from 'sharp';
const source='public/products/lisha-generated',target='public/products/lisha-thumbnails';await fs.mkdir(target,{recursive:true});let before=0,after=0,count=0;
for(const file of (await fs.readdir(source)).filter(f=>f.endsWith('.webp'))){const input=source+'/'+file,output=target+'/'+file;before+=(await fs.stat(input)).size;await sharp(input).resize({width:480,height:480,fit:'inside',withoutEnlargement:true}).webp({quality:80,effort:4}).toFile(output);after+=(await fs.stat(output)).size;count++;}
console.log({count,originalBytes:before,thumbnailBytes:after,reduction:Math.round((1-after/before)*100)+'%'});
