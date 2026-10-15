const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const els=new Map(),events={},storage={data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;}};
class El{
 constructor(){this.hidden=false;this.disabled=false;this.open=false;this.handlers={};this.children=[];}
 append(e){this.children.push(e);}setAttribute(k,v){this[k]=v;}removeAttribute(k){delete this[k];}addEventListener(k,v){this.handlers[k]=v;}focus(){doc.activeElement=this;}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.({});}
 set innerHTML(s){this.html=s;for(const m of s.matchAll(/id="([^"]+)"/g))els.set(m[1],new El());}
}
const balance=new El(),doc={readyState:'complete',head:new El(),body:new El(),activeElement:new El(),createElement:()=>new El(),getElementById:id=>els.get(id),querySelector:s=>s==='[data-cone-coins-balance]'?balance:null,querySelectorAll:s=>s==='[data-cone-coins-balance]'?[balance]:[]};
const ctx=vm.createContext({document:doc,localStorage:storage,navigator:{},addEventListener:(type,fn)=>events[type]=fn,Map,Set,Promise,JSON,Number,Object,Array});vm.runInContext(fs.readFileSync(`${__dirname}/../shared/cone-coins.js`,'utf8'),ctx);const w=ctx.ConeCoins,tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 await w.ready;await w.register('new',[{id:'one',name:'Sunshine plate',price:25},{id:'two',name:'Berry plate',price:25},{id:'three',name:'Magic hat',price:60},{id:'other',name:'Other',price:60}]);
 let p=w.requestUnlock('one');await tick();assert(els.get('cone-unlock-question').textContent.includes('Sunshine plate for 25 Cone Coins'));assert.equal(els.get('cone-unlock-confirm').disabled,true);els.get('cone-unlock-cancel').onclick();assert.equal((await p).reason,'cancelled');assert.equal(w.snapshot().balance,0);
 await w.earnOnce('seed',100);p=w.requestUnlock('one');await tick();const confirm=els.get('cone-unlock-confirm');const buying=confirm.onclick();confirm.onclick();await buying;assert((await p).ok);assert.equal(w.snapshot().balance,75);assert(w.owns('one'));assert(!w.owns('two'));assert.equal((await w.requestUnlock('one')).alreadyOwned,true);assert.equal(w.snapshot().balance,75);
 p=w.requestUnlock('two');await tick();const dialog=doc.body.children.find(x=>x.className==='cone-purchase');dialog.handlers.cancel({preventDefault(){}});assert.equal((await p).reason,'cancelled');assert.equal(w.snapshot().balance,75);
 p=w.requestUnlock('three');await tick();await w.purchase('other');assert.equal(w.snapshot().balance,15);await els.get('cone-unlock-confirm').onclick();assert.equal(w.snapshot().balance,15);assert(!w.owns('three'));assert.equal(els.get('cone-unlock-confirm').disabled,true);els.get('cone-unlock-cancel').onclick();await p;
 const peer=require('../shared/cone-coins')({storage});await peer.ready;await peer.earnOnce('another-page',50);events.storage({key:w.key});await tick();assert.equal(w.snapshot().balance,65);assert.equal(balance.textContent,65);
 console.log('Purchase-dialog checks passed: item name and price, insufficient coins, cancel, Escape, confirmation, duplicate clicks, already-owned items and changed balance.');
})().catch(e=>{console.error(e);process.exit(1)});
