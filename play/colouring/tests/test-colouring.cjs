const assert=require('node:assert/strict');
const {fill,undo,point}=require('../engine.js');
const sharp=require('sharp');
(async()=>{
 let checks=0;
 // Closed lines, edge wrapping, no-op taps and exact undo.
 const p=new Uint32Array(25).fill(0xffffff),b=new Uint8Array(25);for(let y=0;y<5;y++)b[y*5+2]=1;
 let change=fill(p,b,5,5,0,0,0xff0000);assert.equal(change.indices.length,10);assert.equal(p[4],0xffffff);undo(p,change);assert(p.every(c=>c===0xffffff));
 assert.equal(fill(p,b,5,5,2,2,0xff0000),null);assert.equal(fill(p,b,5,5,-1,0,0),null);assert.equal(fill(p,b,5,5,5,0,0),null);assert.equal(fill(p,b,5,5,0,0,0xffffff),null);checks+=7;
 for(const width of [320,360,390,430,768,1024,1440]){
  const rect={left:12,top:200,width:width-24,height:(width-24)*1492/1054};
  const mapped=point(rect,1054,1492,rect.left+rect.width/2,rect.top+rect.height/2);assert(Math.abs(mapped.x-527)<=1 && Math.abs(mapped.y-746)<=1);checks++;
 }
 for(const name of ['daisy','sporty','mystery']){
  const {data,info}=await sharp(`${__dirname}/../assets/${name}-colouring-page.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const n=info.width*info.height,barriers=new Uint8Array(n),pixels=new Uint32Array(n).fill(0xffffff);
  for(let i=0;i<n;i++)barriers[i]=Math.min(data[i*4],data[i*4+1],data[i*4+2])<210?1:0;
  let applied=0;
  for(let t=0;t<100;t++){
   const x=(t*193+61)%info.width,y=(t*271+111)%info.height,colour=0x103090+t*7919;
   const c=fill(pixels,barriers,info.width,info.height,x,y,colour);
   if(c){applied++;for(const i of c.indices){assert.equal(barriers[i],0);assert.equal(pixels[i],colour);}undo(pixels,c);assert(pixels.every(v=>v===0xffffff));}checks++;
  }
  assert(applied>50);console.log(`${name}: 100 fill/undo cases, ${applied} coloured regions; outlines preserved`);
 }
 console.log(`${checks} checks passed`);
})().catch(e=>{console.error(e);process.exit(1)});
