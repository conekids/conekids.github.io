const assert=require('node:assert/strict'),K=require('../engine'),Art=require('../art');let checks=0;
for(const kind of ['flour','egg','milk'])for(let frame=0;frame<=60;frame++){
 const s=K.fresh(),before=JSON.stringify(s),svg=Art.svg(s,K,{ingredient:kind,progress:frame/60});assert(svg.includes('<svg'));assert(!/NaN|Infinity|undefined/.test(svg));assert.equal(JSON.stringify(s),before);checks++;
}
const s=K.fresh();s.stage='decorate';for(let n=0;n<24;n++)s.toppings.push({kind:K.toppings[n%6][0]});
for(let topping=0;topping<24;topping++)for(const p of [0,.25,.5,.72,.85,1]){assert(!/NaN|undefined/.test(Art.svg(s,K,{topping,progress:p})));checks++;}
for(const kind of [...K.toppings.map(x=>x[0]),'flour','egg','milk']){const icon=Art.icon(kind);const ids=Array.from(icon.matchAll(/id="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of icon.matchAll(/url\(#([^)]+)\)/g))assert(ids.includes(m[1]));assert(icon.includes('Gradient'));checks++;}
console.log(`${checks} artwork checks passed: animation frames, every topping position, SVG gradient references and immutable recipe state.`);
