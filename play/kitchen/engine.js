(function(root){
'use strict';
const icing=[['pink','Berry pink','#f375a5'],['blue','Sky blue','#73c9ef'],['purple','Lilac','#b39bf4'],['yellow','Sunny yellow','#ffd56e'],['white','Vanilla','#fff5d7'],['brown','Chocolate','#87533d']];
const toppings=[['strawberry','Strawberry','🍓'],['blueberry','Blueberry','🫐'],['star','Sugar star','⭐'],['chocolate','Choc chip','🍫'],['cherry','Cherry','🍒'],['sprinkles','Sprinkles','🌈']];
const plates=[{at:0,name:'Cloud',colour:'#c8eafa'},{at:25,name:'Sunshine',colour:'#ffe291'},{at:50,name:'Berry',colour:'#ffc5db'},{at:75,name:'Lilac',colour:'#d8c7ff'},{at:100,name:'Rainbow',colour:'url(#rainbow)'}];
const characters=['daisy','sporty','mystery'];
function fresh(coins=0,round=0,guest='daisy',plate=0){return {coins,round,guest,plate,stage:'mix',ingredients:[],mixes:0,icing:'pink',toppings:[],bonus:false,servedReward:null};}
function ticket(s){const n=s.round;return {icing:icing[n%icing.length][0],topping:toppings[Math.floor(n/icing.length)%toppings.length][0],count:2+n%3,reward:10};}
function matches(s){const t=ticket(s);return s.icing===t.icing&&s.toppings.filter(x=>x.kind===t.topping).length===t.count;}
function act(s,type,value){
 switch(type){
 case 'guest':if(characters.includes(value))s.guest=value;break;
 case 'ingredient':if(s.stage==='mix'&&['flour','egg','milk'].includes(value)&&!s.ingredients.includes(value))s.ingredients.push(value);break;
 case 'mix':if(s.stage==='mix'&&s.ingredients.length===3)s.mixes=Math.min(4,s.mixes+1);break;
 case 'bake':if(s.stage==='mix'&&s.mixes===4)s.stage='decorate';break;
 case 'icing':if(s.stage==='decorate'&&icing.some(x=>x[0]===value))s.icing=value;break;
 case 'topping':if(s.stage==='decorate'&&s.toppings.length<24&&toppings.some(x=>x[0]===value))s.toppings.push({kind:value});break;
 case 'undo':if(s.stage==='decorate')s.toppings.pop();break;
 case 'clear':if(s.stage==='decorate')s.toppings=[];break;
 case 'bonus':if(s.stage!=='served')s.bonus=!s.bonus;break;
 case 'plate':if(Number.isInteger(value)&&plates[value])s.plate=value;break;
 case 'serve':if(s.stage==='decorate'){
  const extra=s.bonus&&matches(s)?10:0;s.servedReward={base:5,bonus:extra};s.stage='served';
 }break;
 case 'next':if(s.stage==='served')return fresh(s.coins,s.round+1,s.guest,s.plate);break;
 }
 return s;
}
function restore(raw){
 const d=fresh();try{const s=JSON.parse(raw);if(!s||typeof s!=='object')return d;
 const coins=Number.isInteger(s.coins)?Math.max(0,Math.min(1000000,s.coins)):0,round=Number.isInteger(s.round)?Math.max(0,Math.min(100000,s.round)):0;
 const out=fresh(coins,round,characters.includes(s.guest)?s.guest:'daisy');
 out.plate=Number.isInteger(s.plate)&&plates[s.plate]?s.plate:0;
 out.ingredients=['flour','egg','milk'].filter(x=>s.ingredients?.includes?.(x));out.mixes=out.ingredients.length===3&&Number.isInteger(s.mixes)?Math.max(0,Math.min(4,s.mixes)):0;
 out.stage=['decorate','served'].includes(s.stage)&&out.mixes===4?s.stage:'mix';out.icing=icing.some(x=>x[0]===s.icing)?s.icing:'pink';
 out.toppings=Array.isArray(s.toppings)?s.toppings.filter(x=>x&&toppings.some(t=>t[0]===x.kind)).slice(0,24).map(x=>({kind:x.kind})):[];out.bonus=s.bonus===true;
 if(out.stage==='served')out.servedReward={base:5,bonus:s.servedReward?.bonus===10?10:0};return out;
 }catch(e){return d;}
}
const api={icing,toppings,plates,characters,fresh,ticket,matches,act,restore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kitchen=api;
})(typeof globalThis!=='undefined'?globalThis:this);
