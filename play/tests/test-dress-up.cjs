const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),create=require('../shared/cone-coins');
const file=process.env.CONE_DRESS_UP_HTML||path.join(__dirname,'../dress-up/index.html'),source=fs.readFileSync(file,'utf8').split('<script>')[1].split('</script>')[0];
const tick=()=>new Promise(r=>setImmediate(r));
async function harness(seed={}){
 const els=new Map(),listeners={},storage={data:{...seed},getItem(k){return this.data[k]||null;},setItem(k,v){this.data[k]=v;}};
 class El{constructor(){this.style={};this.dataset={};this.attrs={};this.children=[];this.classes=new Set();this.disabled=false;this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,v)=>{v?this.classes.add(x):this.classes.delete(x);return v;}};}append(e){e.parent=this;this.children.push(e);}replaceChildren(){this.children=[];}remove(){}setAttribute(k,v){this.attrs[k]=v;}setPointerCapture(id){this.capture=id;}getBoundingClientRect(){return {left:10,right:610,top:10,bottom:550,width:600,height:540};}}
 for(const s of ['.characters','.tabs','.items','.outfit-list','#studio','#figure','#character','#back','#front','#dance','#save','#reset','#clearTab','#message','#points','#collection','#unlockMeter','#nextUnlock','#reward'])els.set(s,new El());
 const document={querySelector:s=>{assert(els.has(s),s);return els.get(s);},querySelectorAll:s=>s==='.character-choice'?els.get('.characters').children:s==='.tab'?els.get('.tabs').children:[],createElement:()=>new El(),body:new El(),addEventListener:(type,fn)=>listeners[type]=fn};
 const wallet=create({storage});let confirm=true,prompts=[];wallet.requestUnlock=async id=>{prompts.push(id);return confirm?wallet.purchase(id):{ok:false,reason:'cancelled'};};await wallet.ready;
 const ctx=vm.createContext({document,localStorage:storage,ConeCoins:wallet,Math,setTimeout:()=>1,clearTimeout(){}});vm.runInContext(source,ctx);await tick();assert(vm.runInContext('walletReady',ctx));
 return {els,wallet,storage,prompts,listeners,get:s=>els.get(s),button:id=>els.get('.items').children.find(e=>e.dataset.item===id),choose:i=>els.get('.characters').children[i].onclick(),read:s=>vm.runInContext(s,ctx),confirm:v=>confirm=v,tab:category=>els.get('.tabs').children.find(b=>b.dataset.category===category).onclick(),async click(id){els.get('.items').children.find(b=>b.dataset.item===id).onclick();await tick();}};
}
async function run(){
 let checks=0;
 for(const [points,expected] of [[0,18],[59,18],[60,32],[149,32],[150,48],[299,48],[300,64],[499,64],[500,80]]){const g=await harness({'cone-kids-dress-up-v2':JSON.stringify({points,celebrated:[],looks:{}})});assert.equal(g.read('items.filter(isUnlocked).length'),expected);assert.equal(g.wallet.snapshot().balance,points);checks++;}
 const g=await harness();await g.wallet.earnOnce('kitchen:cupcake:0',100000);assert.equal(g.read('items.filter(isUnlocked).length'),18,'Coins alone must not auto-unlock any item');
 const locked=Array.from(g.read('items.filter(i=>i.unlockAt>0).map(i=>({id:i.id,category:i.category,price:i.unlockAt}))'));
 const first=locked[0];g.tab(first.category);g.confirm(false);await g.click(first.id);assert.equal(g.wallet.snapshot().balance,100000);assert.equal(g.read(`currentLook()['${first.category}']`),null);checks++;
 g.confirm(true);let expected=100000;
 for(const item of locked){g.tab(item.category);const before=g.read('items.filter(isUnlocked).length');await g.click(item.id);expected-=item.price;assert.equal(g.wallet.snapshot().balance,expected);assert.equal(g.read('items.filter(isUnlocked).length'),before+1);assert.equal(g.read(`currentLook()['${item.category}']`),item.id);await g.click(item.id);assert.equal(g.wallet.snapshot().balance,expected);checks++;}
 assert.equal(g.read('items.filter(isUnlocked).length'),80);
 await g.wallet.register('test',[{id:'test:spend-rest',name:'Test',price:expected}]);await g.wallet.purchase('test:spend-rest');expected=0;
 const reloaded=await harness(g.storage.data);assert.equal(reloaded.read('items.filter(isUnlocked).length'),80);assert.equal(reloaded.wallet.snapshot().balance,expected);checks++;
 const h=await harness();for(const [cat,id]of [['outfit','wizard'],['face','round'],['hat','stars'],['prop','wand']]){h.tab(cat);await h.click(id);}await h.els.get('#dance').onclick();assert.equal(h.wallet.snapshot().balance,44);h.els.get('#dance').onclick();await h.els.get('#dance').onclick();assert.equal(h.wallet.snapshot().balance,44);checks++;
 console.log(`${checks} Dress Up wallet checks passed: every paid item bought separately, cancellation, no group unlocks, repeat taps, reloads, legacy ownership and shared earnings.`);
}
module.exports={harness,run};if(require.main===module)run().catch(e=>{console.error(e);process.exit(1)});
