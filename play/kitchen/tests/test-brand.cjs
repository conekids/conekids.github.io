const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(`${__dirname}/../brand.js`,'utf8');
async function test(cached,fetchOK=true,storageOK=true){
 let fetched=0,stored=null,crop=null;const image={hidden:true,set src(v){this.value=v;queueMicrotask(()=>this.onload());}},fallback={hidden:false};
 const context={document:{getElementById:id=>id==='brand-logo'?image:fallback,createElement:()=>({getContext:()=>({drawImage:(...args)=>crop=args.slice(1)}),toDataURL:()=> 'data:image/png;base64,CROPPED_LOGO'})},localStorage:{getItem:()=>{if(!storageOK)throw Error('blocked');return cached;},setItem:(k,v)=>{if(!storageOK)throw Error('blocked');stored={k,v};}},fetch:async()=>{fetched++;return {ok:fetchOK,text:async()=> '<html></html>'};},DOMParser:class{parseFromString(){return {querySelector:()=>({getAttribute:()=> 'data:image/png;base64,HOME'})};}},Image:class{constructor(){this.naturalWidth=1024;}set src(v){queueMicrotask(()=>this.onload());}},Promise};
 vm.createContext(context);await vm.runInContext(source,context);await new Promise(r=>setImmediate(r));return {image,fallback,fetched,stored,crop};
}
(async()=>{
 let r=await test(null);assert.equal(r.image.hidden,false);assert.equal(r.fallback.hidden,true);assert.deepEqual(Array.from(r.crop),[51,12,285,47,0,0,570,94]);assert.equal(r.stored.k,'cone-kids-approved-logo-v1');
 r=await test('data:image/png;base64,CACHED');assert.equal(r.fetched,0);assert.equal(r.image.value,'data:image/png;base64,CACHED');
 r=await test(null,false);assert.equal(r.fallback.hidden,false);assert.equal(r.image.hidden,true);
 r=await test(null,true,false);assert.equal(r.image.hidden,false);assert.equal(r.stored,null);
 r=await test('https://untrusted.example/logo.png',false);assert.equal(r.fetched,1);assert.equal(r.fallback.hidden,false);
 console.log('Brand checks passed: exact homepage logo bounds, cached display, offline fallback, blocked storage and untrusted cache rejection.');
})().catch(e=>{console.error(e);process.exit(1)});
