const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),create=require('../shared/cone-coins');
const tick=()=>new Promise(r=>setImmediate(r));
function storage(){return {data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;}};}
const popFile=process.env.CONE_POP_HTML||path.join(__dirname,'../cone-pop/index.html'),jigFile=process.env.CONE_JIGSAW_HTML||path.join(__dirname,'../halloween-jigsaws/index.html');
(async()=>{
 const wallet=create({storage:storage()});await wallet.ready;const els=new Map();function $(s){if(!els.has(s))els.set(s,{style:{display:'flex'},children:[],textContent:'',append(e){this.children.push(e);}});return els.get(s);}
 const pop=fs.readFileSync(popFile,'utf8').split('\n').find(x=>x.startsWith('function check(){'));
 const c=vm.createContext({ConeCoins:wallet,$,document:{createElement:()=>({textContent:''})},sfx(){},saveNow(){},L:Array.from({length:50},(_,i)=>['Level '+i,20,10,'score']),lv:0,stars:10,moves:10,remaining:0,bossHP:0,score:100,save:{ratings:[],unlocked:1}});vm.runInContext(pop,c);
 for(let lv=0;lv<50;lv++){c.lv=lv;c.stars=9;vm.runInContext('check()',c);await tick();assert.equal(wallet.snapshot().balance,lv*10);c.stars=10;vm.runInContext('check();check();check()',c);await tick();assert.equal(wallet.snapshot().balance,(lv+1)*10);}
 const jig=fs.readFileSync(jigFile,'utf8').split('\n').find(x=>x.startsWith('function checkCompletion(){'));
 const ctx=vm.createContext({ConeCoins:wallet,$,completed:false,ready:true,placed:new Set(),cols:3,rows:2,current:0,generation:0,pieces:Array(6),selected:null,puzzles:[{name:'Daisy'},{name:'Sporty'},{name:'Mystery'}],cancelDrag(){}});$('.win').showModal=()=>{};$('#again').focus=()=>{};vm.runInContext(jig,ctx);
 let total=500;
 for(let current=0;current<3;current++)for(const n of [6,12,24]){
  Object.assign(ctx,{current,pieces:Array(n),cols:n/2,rows:2,completed:false,placed:new Set(Array.from({length:n},(_,i)=>i)),generation:ctx.generation+1});vm.runInContext('checkCompletion();checkCompletion()',ctx);await tick();total+=n===6?5:n===12?10:15;assert.equal(wallet.snapshot().balance,total);
  ctx.completed=false;vm.runInContext('checkCompletion()',ctx);await tick();assert.equal(wallet.snapshot().balance,total,'Replay must not duplicate a puzzle reward');
 }
 console.log('Completion reward checks passed: all 50 Cone Pop levels and all 9 jigsaw image/difficulty combinations; incomplete and repeated completions do not duplicate coins.');
})().catch(e=>{console.error(e);process.exit(1)});
