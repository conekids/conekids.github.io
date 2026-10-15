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
function undo(pixels,change){for(const i of change.indices)pixels[i]=change.before;}
function point(rect,width,height,x,y){return {x:Math.floor((x-rect.left)*width/rect.width),y:Math.floor((y-rect.top)*height/rect.height)};}
const api={fill,undo,point};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ColouringEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
