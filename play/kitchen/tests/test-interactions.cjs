const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),K=require('../engine'),Art=require('../art');
class El{
 constructor(){this.handlers={};this.children=[];this.dataset={};this.style={};this.attrs={};this.disabled=false;this.hidden=false;this.textContent='';const set=new Set();this.classList={add:(x)=>set.add(x),remove:x=>set.delete(x),toggle:(x,v)=>v?set.add(x):set.delete(x)};}
 addEventListener(type,fn){this.handlers[type]=fn;}setAttribute(k,v){this.attrs[k]=v;}append(e){this.children.push(e);}click(){if(!this.disabled)return this.handlers.click?.({target:this});}remove(){}
 set innerHTML(v){this.html=v;this.children=[];if(v.includes('data-plate='))for(const m of v.matchAll(/data-plate="(\d+)"/g)){const e=new El();e.dataset.plate=m[1];this.children.push(e);}}
 get innerHTML(){return this.html||'';}
 querySelectorAll(selector){return this.children.filter(e=>selector==='[data-plate]'?e.dataset.plate!==undefined:true);}
 getContext(){return {fillRect(){},fillText(){},drawImage(){}};}toBlob(cb){cb({});}
}
const ids={};for(const m of fs.readFileSync(`${__dirname}/../index.html`,'utf8').matchAll(/id="([^"]+)"/g))ids[m[1]]=new El();
const guest=K.characters.map(x=>{const b=new El();b.dataset.guest=x;return b;}),ingredients=['flour','egg','milk'].map(x=>{const b=new El();b.dataset.ingredient=x;return b;});
const scene=new El(),footer=new El(),timers=[],frames=[];const store=new Map();const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};const wallet=require('../../shared/cone-coins')({storage});wallet.requestUnlock=id=>wallet.purchase(id);let clock=0;function finishAnimation(){let n=0;while(frames.length){assert(n++<100);clock+=100;frames.shift()(clock);}}let downloads=0;
const doc={getElementById:id=>{assert(ids[id],`Unknown id ${id}`);return ids[id];},querySelector:s=>s==='.scene'?scene:footer,querySelectorAll:s=>s==='[data-guest]'?guest:s==='[data-ingredient]'?ingredients:s==='[data-icing]'?ids.icings.children:s==='[data-topping]'?ids.toppings.children:[],createElement:tag=>{const e=new El();if(tag==='a')e.click=()=>downloads++;return e;},body:new El()};
class Image{set src(v){queueMicrotask(()=>this.onload());}}
const context={document:doc,Kitchen:K,KitchenArt:Art,localStorage:storage,ConeCoins:wallet,window:{matchMedia:()=>({matches:false})},requestAnimationFrame:fn=>frames.push(fn),Image,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:fn=>timers.push(fn),JSON,Array,String,Number,Promise};vm.createContext(context);vm.runInContext(fs.readFileSync(`${__dirname}/../app.js`,'utf8'),context);
async function run(){
 await wallet.ready;await new Promise(r=>setImmediate(r));
 assert.equal(ids.mix.disabled,true);assert.equal(ids['decorate-panel'].hidden,true);
 for(const b of ingredients){b.click();assert.equal(ids.picture.disabled,true);finishAnimation();}assert.equal(ids.mix.disabled,false);for(let n=0;n<4;n++)ids.mix.click();assert.equal(ids.bake.hidden,false);
 ids.bake.click();ids.bake.click();assert.equal(timers.length,1);timers.shift()();assert.equal(ids['decorate-panel'].hidden,false);assert.equal(ids['mix-panel'].hidden,true);
 ids.bonus.click();assert.equal(ids['order-details'].hidden,false);const t=K.ticket(K.fresh());ids.icings.children.find(b=>b.dataset.icing===t.icing).click();for(let n=0;n<t.count;n++){ids.toppings.children.find(b=>b.dataset.topping===t.topping).click();assert.equal(ids.serve.disabled,true);finishAnimation();}
 await ids.serve.click();await ids.serve.click();assert.equal(ids.coins.textContent,15);assert.equal(ids['served-panel'].hidden,false);assert(ids.reward.textContent.includes('10 bonus'));
 await ids.picture.click();assert.equal(downloads,1);assert.equal(ids.picture.disabled,false);
 ids.next.click();assert.equal(ids.coins.textContent,15);assert.equal(ids['mix-panel'].hidden,false);assert.equal(ids['order-details'].hidden,true);
 for(const b of ingredients){b.click();assert.equal(ids.picture.disabled,true);finishAnimation();}for(let n=0;n<4;n++)ids.mix.click();ids.bake.click();while(timers.length)timers.shift()();ids.bonus.click();await ids.serve.click();assert.equal(ids.coins.textContent,20);assert(!ids.reward.textContent.includes('10 bonus'));assert.equal(JSON.parse(store.get('cone-kids-kitchen-v1')).stage,'served');
 await wallet.earnOnce('another-game',100);assert.equal(ids.coins.textContent,120);assert(!wallet.owns('kitchen:plate:1'));await ids.plates.children[1].click();assert.equal(wallet.snapshot().balance,95);assert(wallet.owns('kitchen:plate:1'));assert(!wallet.owns('kitchen:plate:2'));await ids.plates.children[1].click();assert.equal(wallet.snapshot().balance,95);wallet.requestUnlock=async()=>({ok:false,reason:'cancelled'});await ids.plates.children[2].click();assert.equal(wallet.snapshot().balance,95);assert(!wallet.owns('kitchen:plate:2'));
 assert(ingredients[0].innerHTML.includes('<svg'));assert(ids.toppings.children.every(b=>b.innerHTML.includes('<svg')));
 console.log('Animation and UI event checks passed: animated ingredients, topping landings, input locking, mixing, duplicate bake, decorating, optional orders, duplicate serve, PNG download, next creation and local saving.');
}
run().catch(e=>{console.error(e);process.exit(1)});
