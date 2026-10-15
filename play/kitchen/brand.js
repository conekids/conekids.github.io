/* Reuse the approved homepage logo without redrawing its lettering. */
(async function(){
 'use strict';
 const image=document.getElementById('brand-logo'),fallback=document.getElementById('brand-fallback');
 const key='cone-kids-approved-logo-v1';
 function show(src){image.onload=()=>{image.hidden=false;fallback.hidden=true;};image.src=src;}
 try{
  try{const cached=localStorage.getItem(key);if(cached?.startsWith('data:image/png;base64,')){show(cached);return;}}catch(e){}
  const response=await fetch('/',{cache:'force-cache'});if(!response.ok)return;
  const home=new DOMParser().parseFromString(await response.text(),'text/html');
  const src=home.querySelector('img.artwork')?.getAttribute('src');
  if(!src?.startsWith('data:image/png;base64,'))return;
  const artwork=new Image();await new Promise((resolve,reject)=>{artwork.onload=resolve;artwork.onerror=reject;artwork.src=src;});
  const canvas=document.createElement('canvas');canvas.width=570;canvas.height=94;
  const scale=artwork.naturalWidth/1024;
  canvas.getContext('2d').drawImage(artwork,51*scale,12*scale,285*scale,47*scale,0,0,570,94);
  const logo=canvas.toDataURL('image/png');show(logo);
  try{localStorage.setItem(key,logo);}catch(e){}
 }catch(e){/* The readable colour-letter fallback remains available offline. */}
})();
