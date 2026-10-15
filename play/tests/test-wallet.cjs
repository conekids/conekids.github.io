const assert=require('node:assert/strict'),create=require('../shared/cone-coins');
const storage=seed=>({data:{...seed},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;}});
function locks(){let queue=Promise.resolve();return {request:(key,fn)=>{const result=queue.then(fn,fn);queue=result.catch(()=>{});return result;}};}
const items=[{id:'kitchen:plate:0',name:'Cloud plate',price:0,legacyAt:0},{id:'kitchen:plate:1',name:'Sunshine plate',price:25,legacyAt:25},{id:'kitchen:plate:2',name:'Berry plate',price:50,legacyAt:50}];
(async()=>{
 let checks=0;
 const s=storage({'cone-kids-kitchen-v1':JSON.stringify({coins:15,round:1,stage:'mix'}),'cone-kids-dress-up-v2':JSON.stringify({points:44})}),mutex=locks(),a=create({storage:s,locks:mutex}),b=create({storage:s,locks:mutex});await Promise.all([a.ready,b.ready]);assert.equal(a.snapshot().balance,59);assert.equal(b.snapshot().balance,59);checks++;
 await a.register('kitchen',items);assert(a.owns(items[0].id));assert(!a.owns(items[1].id));
 await a.earnOnce('new-play',100);assert(!a.owns(items[1].id),'A large balance does not unlock items');
 assert.equal((await a.purchase(items[1].id)).spent,25);assert.equal(a.snapshot().balance,134);assert(!a.owns(items[2].id),'Purchase unlocks one item only');
 for(let i=0;i<20;i++)assert((await a.purchase(items[1].id)).alreadyOwned);assert.equal(a.snapshot().balance,134);checks+=23;
 const reloaded=create({storage:s,locks:mutex});await reloaded.ready;await reloaded.register('kitchen',items);assert(reloaded.owns(items[1].id));assert.equal(reloaded.snapshot().balance,134);await reloaded.register('kitchen',items);assert.equal(reloaded.snapshot().balance,134);checks++;
 // Old paid rounds and repeated completion callbacks must never duplicate earnings.
 assert.equal((await a.earnOnce('kitchen:cupcake:0',15)).amount,0);assert.equal((await a.earnOnce('kitchen:cupcake:1',15)).amount,15);assert.equal((await a.earnOnce('kitchen:cupcake:1',15)).amount,0);checks++;
 for(let trial=0;trial<100;trial++){
  const shared=storage(),lock=locks(),x=create({storage:shared,locks:lock}),y=create({storage:shared,locks:lock});await Promise.all([x.ready,y.ready]);const catalog=[{id:'a',name:'A',price:80},{id:'b',name:'B',price:80}];await Promise.all([x.register('new',catalog),y.register('new',catalog)]);await x.earnOnce('seed',100);
  const result=await Promise.all([x.purchase('a'),y.purchase('b')]);assert.equal(result.filter(r=>r.ok).length,1);await Promise.all([x.refresh(),y.refresh()]);assert.equal(x.snapshot().balance,20);assert.equal(y.snapshot().balance,20);assert.equal(x.snapshot().owned.filter(id=>id==='a'||id==='b').length,1);
  const earnings=await Promise.all([x.earnOnce('same-completion',10),y.earnOnce('same-completion',10)]);assert.equal(earnings.reduce((n,r)=>n+r.amount,0),10);await x.refresh();assert.equal(x.snapshot().balance,30);checks++;
 }
 const broken=storage(),w=create({storage:broken});await w.ready;await w.register('x',[{id:'x',name:'X',price:10}]);await w.earnOnce('start',20);broken.setItem=()=>{throw Error('quota');};const result=await w.purchase('x');assert.equal(result.reason,'storage');assert.equal(w.snapshot().balance,20);assert(!w.owns('x'));checks++;
 for(const value of [-1,2.5,'10',NaN,Infinity])assert.equal((await w.earnOnce('bad',value)).reason,'invalid');assert.equal((await w.purchase('unknown')).reason,'unknown');checks+=6;
 const legacy=storage({'cone-kids-kitchen-v1':JSON.stringify({coins:50,round:4,stage:'served'})}),old=create({storage:legacy});await old.ready;await old.register('kitchen',items);assert.equal(old.snapshot().balance,50);assert(old.owns(items[1].id)&&old.owns(items[2].id));assert.equal((await old.earnOnce('kitchen:cupcake:4',15)).amount,0);await old.earnOnce('kitchen:cupcake:5',5);assert.equal(old.snapshot().balance,55);checks++;
 console.log(`${checks} shared-wallet checks passed: migration, individual unlocks, duplicate rewards/purchases, insufficient funds, reloads, failed storage and 100 concurrent-tab scenarios.`);
})().catch(e=>{console.error(e);process.exit(1)});
