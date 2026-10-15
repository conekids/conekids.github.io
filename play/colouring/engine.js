/* Shared, browser-independent colouring operations. */
(function(root){
'use strict';
function fill(pixels, barriers, width, height, x, y, colour){
  x=Math.floor(x); y=Math.floor(y);
  if(x<0||y<0||x>=width||y>=height)return null;
  const start=y*width+x, before=pixels[start];
  if(barriers[start]||before===colour)return null;
  const stack=new Uint32Array(pixels.length), changed=new Uint32Array(pixels.length);
  let count=0, top=0;
  function add(i){if(!barriers[i]&&pixels[i]===before){pixels[i]=colour;stack[top++]=i;}}
  add(start);
  while(top){
    const i=stack[--top];changed[count++]=i;
    const col=i%width;
    if(col)add(i-1);if(col+1<width)add(i+1);
    if(i>=width)add(i-width);if(i+width<pixels.length)add(i+width);
  }
  return {indices:changed.slice(0,count),before};
}
function undo(pixels,change){for(let n=0;n<change.indices.length;n++)pixels[change.indices[n]]=typeof change.before==='number'?change.before:change.before[n];}
// Round brush segment, including stationary dots. A stroke remembers each original
// pixel once so one Undo restores every colour underneath overlapping scribbles.
function stroke(pixels,width,height,from,to,radius,colour,before){
 const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;
 const left=Math.max(0,Math.floor(Math.min(from.x,to.x)-radius)),right=Math.min(width-1,Math.ceil(Math.max(from.x,to.x)+radius));
 const top=Math.max(0,Math.floor(Math.min(from.y,to.y)-radius)),bottom=Math.min(height-1,Math.ceil(Math.max(from.y,to.y)+radius));
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const t=length?Math.max(0,Math.min(1,((x-from.x)*dx+(y-from.y)*dy)/length)):0;
  if((x-from.x-t*dx)**2+(y-from.y-t*dy)**2>radius*radius)continue;
  const i=y*width+x;if(pixels[i]===colour)continue;
  if(!before.has(i))before.set(i,pixels[i]);pixels[i]=colour;
 }
}
function finishStroke(before){return before.size?{indices:Uint32Array.from(before.keys()),before:Uint32Array.from(before.values())}:null;}
function point(rect,width,height,x,y){return {x:Math.floor((x-rect.left)*width/rect.width),y:Math.floor((y-rect.top)*height/rect.height)};}
const api={fill,undo,point,stroke,finishStroke};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ColouringEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
