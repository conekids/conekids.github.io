const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const engine=require('../engine');
class El{
 constructor(){this.handlers={};this.children=[];this.dataset={};this.style={};this.width=8;this.height=8;this.disabled=false;}
 addEventListener(type,fn){this.handlers[type]=fn;}setAttribute(k,v){this[k]=v;}append(e){this.children.push(e);}remove(){}click(){this.handlers.click?.({target:this});}querySelectorAll(){return this.children;}
 getBoundingClientRect(){return {left:0,top:0,width:80,height:80};}
 getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},drawImage(){},fillRect(){},getImageData:()=>({data:new Uint8ClampedArray(8*8*4).fill(255)})};}
 toBlob(fn){fn({type:'image/png'});}toDataURL(){return 'data:image/png;base64,TEST';}
}
const ids={};for(const id of ['artwork','status','palette','custom-colour','undo','reset','picture','print','page-name','print-artwork'])ids[id]=new El();
const chars=['daisy','sporty','mystery'].map(c=>{const e=new El();e.dataset.character=c;return e;});let downloads=0,prints=0;
const doc={querySelector:s=>ids[s.slice(1)],querySelectorAll:s=>s==='[data-character]'?chars:['undo','reset','picture','print'].map(x=>ids[x]),createElement:tag=>{const e=new El();if(tag==='a')e.click=()=>{assert(e.download.endsWith('.png'));downloads++;};return e;},body:new El()};
class Img{constructor(){this.naturalWidth=8;this.naturalHeight=8;}set src(v){queueMicrotask(()=>this.onload());}}
const context={document:doc,Image:Img,ColouringEngine:engine,Uint8Array,Uint32Array,Math,Map,Promise,confirm:()=>true,window:{print:()=>prints++},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:fn=>fn()};
vm.createContext(context);vm.runInContext(fs.readFileSync(`${__dirname}/../app.js`,'utf8'),context);
const tick=()=>new Promise(r=>setImmediate(r));
function tap(x,y,moved=false){const e={pointerId:1,clientX:x,clientY:y,button:0,pointerType:'touch'};ids.artwork.handlers.pointerdown(e);if(moved)ids.artwork.handlers.pointermove({...e,clientY:y+20});ids.artwork.handlers.pointerup(e);}
(async()=>{
 await tick();assert.equal(ids.palette.children.length,18);assert.equal(ids.picture.disabled,false);
 tap(20,20,true);assert.equal(ids.undo.disabled,true,'scroll must not colour');
 ids.artwork.handlers.pointerdown({pointerId:1,clientX:20,clientY:20,button:0});ids.artwork.handlers.pointercancel();ids.artwork.handlers.pointerup({pointerId:1,clientX:20,clientY:20});assert.equal(ids.undo.disabled,true);
 tap(20,20);assert.equal(ids.undo.disabled,false);ids.undo.click();assert.equal(ids.undo.disabled,true);
 for(const c of chars){c.click();await tick();tap(20,20);assert.equal(ids.undo.disabled,false);ids.picture.click();ids.print.click();ids['print-artwork'].onload();ids.reset.click();assert.equal(ids.undo.disabled,true);}
 assert.equal(downloads,3);assert.equal(prints,3);
 chars[0].click();chars[1].click();chars[2].click();await tick();assert.equal(ids['page-name'].textContent,'Mystery');
 console.log('Interaction checks passed: palette, tap, scroll, cancellation, undo, reset, character switching, PNG and print for all three characters.');
})().catch(e=>{console.error(e);process.exit(1)});
