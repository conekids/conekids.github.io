'use strict';
const canvas=document.querySelector('#artwork'),ctx=canvas.getContext('2d');
const paint=document.createElement('canvas'),paintCtx=paint.getContext('2d');
const status=document.querySelector('#status'),palette=document.querySelector('#palette');
const names={daisy:'Daisy',sporty:'Sporty',mystery:'Mystery'},pages=new Map();
const colours=['#ff477e','#ff8c42','#ffd43b','#91d440','#22b573','#34c9c3','#46b9ef','#3972db','#8957d9','#ce75de','#ffb6cf','#ffe7ad','#bce8fa','#b78561','#70462b','#5d6472','#171923','#ffffff'];
let active='daisy',selected=0xff477e,loading=true,generation=0,gesture=null,mode='fill',frame=null;
function hint(){announce(mode==='draw'?'Draw with your finger or mouse. To scroll on a phone, swipe beside the picture or choose Fill.':'Pick a colour, then tap inside a shape. Swipe to scroll the page.');}
function remember(page,change){
 if(!change)return;
 page.history.push(change);
 const bytes=c=>c.indices.byteLength+(typeof c.before==='number'?0:c.before.byteLength);
 while(page.history.length>12||page.history.reduce((n,c)=>n+bytes(c),0)>16*1024*1024)page.history.shift();
}
function finishGesture(){
 const g=gesture;gesture=null;
 if(g?.before){remember(g.page,ColouringEngine.finishStroke(g.before));if(canvas.hasPointerCapture(g.id))canvas.releasePointerCapture(g.id);render();}
}
function scheduleRender(){if(frame===null)frame=requestAnimationFrame(()=>{frame=null;render();});}
function setMode(next){
 finishGesture();mode=next;
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 document.querySelector('#brush-controls').hidden=mode!=='draw';canvas.style.touchAction=mode==='draw'?'none':'pan-y pinch-zoom';hint();
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelector('#brush-size').addEventListener('input',e=>{document.querySelector('#brush-value').textContent=e.target.value;});
function announce(text){status.textContent=text;}
function controls(){document.querySelectorAll('[data-action]').forEach(b=>b.disabled=loading);document.querySelector('#undo').disabled=loading||!pages.get(active)?.history.length;}
function chooseColour(hex){selected=parseInt(hex.slice(1),16);document.querySelector('#custom-colour').value=hex;palette.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.colour===hex)));}
colours.forEach((hex,i)=>{const b=document.createElement('button');b.type='button';b.className='swatch';b.style.background=hex;b.dataset.colour=hex;b.title=hex==='#ffffff'?'White / erase':`Colour ${i+1}`;b.setAttribute('aria-label',b.title);b.addEventListener('click',()=>chooseColour(hex));palette.append(b);});
chooseColour(colours[0]);
document.querySelector('#custom-colour').addEventListener('input',e=>chooseColour(e.target.value));
function render(){
 const page=pages.get(active);if(!page)return;
 const data=paintCtx.createImageData(page.width,page.height);
 for(let i=0;i<page.pixels.length;i++){const c=page.pixels[i],j=i*4;data.data[j]=c>>16;data.data[j+1]=(c>>8)&255;data.data[j+2]=c&255;data.data[j+3]=255;}
 paintCtx.putImageData(data,0,0);ctx.globalCompositeOperation='source-over';ctx.drawImage(paint,0,0);ctx.globalCompositeOperation='multiply';ctx.drawImage(page.image,0,0,page.width,page.height);ctx.globalCompositeOperation='source-over';controls();
}
async function selectPage(key){
 finishGesture();const token=++generation;active=key;loading=true;controls();
 document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===key)));
 document.querySelector('#page-name').textContent=names[key];canvas.setAttribute('aria-label',`${names[key]} colouring page. Choose Draw to scribble or Fill to colour a shape.`);canvas.style.visibility='hidden';announce(`Loading ${names[key]}…`);
 try{
  if(!pages.has(key)){
   const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=`assets/${key}-colouring-page.png`;});
   const width=image.naturalWidth,height=image.naturalHeight,source=document.createElement('canvas');source.width=width;source.height=height;const sc=source.getContext('2d');sc.fillStyle='#fff';sc.fillRect(0,0,width,height);sc.drawImage(image,0,0);const data=sc.getImageData(0,0,width,height).data,barriers=new Uint8Array(width*height);
   for(let i=0;i<barriers.length;i++){const j=i*4;barriers[i]=Math.min(data[j],data[j+1],data[j+2])<210?1:0;}
   pages.set(key,{image:source,width,height,barriers,pixels:new Uint32Array(width*height).fill(0xffffff),history:[]});
  }
  if(token!==generation)return;
  const page=pages.get(key);canvas.width=paint.width=page.width;canvas.height=paint.height=page.height;loading=false;render();canvas.style.visibility='visible';hint();
 }catch(e){if(token!==generation)return;loading=true;controls();announce('This picture could not load. Please choose the character again to retry.');}
}
document.querySelectorAll('[data-character]').forEach(b=>b.addEventListener('click',()=>selectPage(b.dataset.character)));
function brushPoint(e,g){
 const p=ColouringEngine.point(canvas.getBoundingClientRect(),g.page.width,g.page.height,e.clientX,e.clientY);
 ColouringEngine.stroke(g.page.pixels,g.page.width,g.page.height,g.last,p,g.radius,g.colour,g.before);g.last=p;
}
canvas.addEventListener('pointerdown',e=>{
 if(loading||gesture||e.isPrimary===false||!(e.button===0||e.pointerType==='touch'))return;
 gesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
 if(mode==='draw'){
  const page=pages.get(active),rect=canvas.getBoundingClientRect(),p=ColouringEngine.point(rect,page.width,page.height,e.clientX,e.clientY);
  Object.assign(gesture,{page,last:p,radius:Number(document.querySelector('#brush-size').value)*page.width/rect.width/2,colour:selected,before:new Map()});
  canvas.setPointerCapture(e.pointerId);brushPoint(e,gesture);scheduleRender();
 }
});
canvas.addEventListener('pointermove',e=>{
 const g=gesture;if(!g||g.id!==e.pointerId)return;
 if(g.before){const samples=e.getCoalescedEvents?.();for(const sample of samples?.length?samples:[e])brushPoint(sample,g);scheduleRender();}
 else if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>10)g.moved=true;
});
canvas.addEventListener('pointercancel',finishGesture);
canvas.addEventListener('lostpointercapture',finishGesture);
canvas.addEventListener('pointerleave',()=>{if(!gesture?.before)gesture=null;});
canvas.addEventListener('pointerup',e=>{
 const g=gesture;if(!g||g.id!==e.pointerId)return;
 if(g.before){brushPoint(e,g);finishGesture();announce('Lovely drawing! Undo removes your last stroke.');return;}
 gesture=null;if(g.moved||loading)return;
 const page=pages.get(active),p=ColouringEngine.point(canvas.getBoundingClientRect(),page.width,page.height,e.clientX,e.clientY);
 const change=ColouringEngine.fill(page.pixels,page.barriers,page.width,page.height,p.x,p.y,selected);
 if(!change)return;remember(page,change);render();announce('Lovely colouring! Keep choosing colours and tapping shapes.');
});
document.querySelector('#undo').addEventListener('click',()=>{finishGesture();const page=pages.get(active),change=page.history.pop();if(change){ColouringEngine.undo(page.pixels,change);render();announce('Last colour undone.');}});
document.querySelector('#reset').addEventListener('click',()=>{finishGesture();if(!confirm(`Start ${names[active]}'s picture again? This clears its colours.`))return;const page=pages.get(active);page.pixels.fill(0xffffff);page.history=[];render();announce('A fresh page, ready to colour!');});
document.querySelector('#picture').addEventListener('click',()=>{
 finishGesture();const pictureName=active;canvas.toBlob(blob=>{if(!blob){announce('Picture could not be saved. Please try again.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`cone-kids-${pictureName}-colouring.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Your picture is ready to save. Check your downloads.');},'image/png');
});
document.querySelector('#print').addEventListener('click',()=>{
 finishGesture();const image=document.querySelector('#print-artwork');image.onload=()=>{window.print();image.onload=null;};image.src=canvas.toDataURL('image/png');
});
selectPage('daisy');
