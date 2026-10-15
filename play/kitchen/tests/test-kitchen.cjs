const assert=require('node:assert/strict'),K=require('../engine'),Art=require('../art');
function bake(s){for(const id of ['flour','egg','milk'])K.act(s,'ingredient',id);for(let i=0;i<4;i++)K.act(s,'mix');K.act(s,'bake');assert.equal(s.stage,'decorate');return s;}
let checks=0;
for(const guest of K.characters)for(let round=0;round<100;round++){
 let free=bake(K.fresh(0,round,guest));K.act(free,'icing','brown');K.act(free,'serve');assert.equal(free.coins,5);assert.equal(free.servedReward.bonus,0);checks++;
 let bonus=bake(K.fresh(0,round,guest));const t=K.ticket(bonus);K.act(bonus,'bonus');K.act(bonus,'icing',t.icing);for(let i=0;i<t.count;i++)K.act(bonus,'topping',t.topping);const other=K.toppings.find(x=>x[0]!==t.topping)[0];K.act(bonus,'topping',other);K.act(bonus,'serve');assert.equal(bonus.coins,15);assert.equal(bonus.servedReward.bonus,10);checks++;
 let own=bake(K.fresh(0,round,guest));K.act(own,'bonus');K.act(own,'serve');assert.equal(own.coins,5);assert.equal(own.servedReward.bonus,0);checks++;
 for(const s of [free,bonus,own]){const coins=s.coins;for(let i=0;i<20;i++)K.act(s,'serve');assert.equal(s.coins,coins);const resumed=K.restore(JSON.stringify(s));K.act(resumed,'serve');assert.equal(resumed.coins,coins);const next=K.act(resumed,'next');assert.equal(next.coins,coins);assert.equal(next.round,round+1);assert.equal(next.stage,'mix');checks++;}
}
let s=K.fresh();K.act(s,'bake');K.act(s,'serve');assert.equal(s.coins,0);assert.equal(s.stage,'mix');K.act(s,'ingredient','flour');K.act(s,'ingredient','flour');K.act(s,'mix');assert.equal(s.ingredients.length,1);assert.equal(s.mixes,0);checks++;
s=bake(K.fresh());for(let i=0;i<100;i++)K.act(s,'topping','star');assert.equal(s.toppings.length,24);K.act(s,'undo');assert.equal(s.toppings.length,23);K.act(s,'clear');assert.equal(s.toppings.length,0);checks++;
for(const coins of [0,24,25,49,50,74,75,99,100])for(let plate=0;plate<K.plates.length;plate++){s=K.fresh(coins);K.act(s,'plate',plate);assert.equal(s.plate,coins>=K.plates[plate].at?plate:0);assert.equal(s.coins,coins);checks++;}
for(const value of [null,'null','{}','not json','{"coins":-100}','{"coins":1e99,"round":-1,"stage":"served"}']){s=K.restore(value);assert(s.coins>=0&&Number.isFinite(s.coins));assert.equal(s.stage,'mix');checks++;}
for(const topping of K.toppings){s=bake(K.fresh(100));K.act(s,'topping',topping[0]);assert(Art.svg(s,K).includes('<svg'));assert(!Art.svg(s,K).includes('undefined'));checks++;}
console.log(`${checks} kitchen checks passed: 300 free-play, 300 bonus orders, 300 independent recipes, repeat serving, reloads, progression and plate unlocks.`);
