'use strict';
const $=id=>document.getElementById(id),K=Kitchen,storageKey='cone-kids-kitchen-v1';
let state=K.fresh(),busy=false,sound=false,audio=null;
try{state=K.restore(localStorage.getItem(storageKey));}catch(e){}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(e){document.querySelector('.footer-note').textContent='Have fun! Progress cannot be saved in this browser session.';}}
function chime(){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();[523,659,784].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=f;g.gain.setValueAtTime(.0001,audio.currentTime+i*.09);g.gain.exponentialRampToValueAtTime(.08,audio.currentTime+i*.09+.01);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+i*.09+.25);o.start(audio.currentTime+i*.09);o.stop(audio.currentTime+i*.09+.3);});}catch(e){}}
function dispatch(type,value){if(busy)return;const oldStage=state.stage;state=K.act(state,type,value);persist();render();if(type==='serve'&&oldStage==='decorate')chime();}
function render(){
 const guest=state.guest[0].toUpperCase()+state.guest.slice(1),served=state.stage==='served',decorating=state.stage==='decorate';
 $('coins').textContent=state.coins;$('guest').src=`/play/dress-up/assets/${state.guest}.png`;$('guest').alt=guest;
 document.querySelectorAll('[data-guest]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guest===state.guest)));
 document.querySelectorAll('[data-ingredient]').forEach(b=>{const added=state.ingredients.includes(b.dataset.ingredient);b.classList.toggle('added',added);b.disabled=added||busy;b.setAttribute('aria-pressed',String(added));});
 $('mix-panel').hidden=state.stage!=='mix';$('decorate-panel').hidden=!decorating;$('served-panel').hidden=!served;
 $('mix').hidden=state.mixes===4;$('mix').disabled=state.ingredients.length!==3||busy;$('mix-count').textContent=`${state.mixes}/4`;$('bake').hidden=state.mixes!==4;$('bake').disabled=busy;
 $('speech').textContent=served?['Thank you, chef! Delicious!','Wow! You made this for me?','What a wonderful creation!'][K.characters.indexOf(state.guest)]:decorating?'Ooh! What will you put on top?':'Shall we make a cupcake?';
 $('food').innerHTML=KitchenArt.svg(state,K);$('food').setAttribute('aria-label',state.stage==='mix'?`Mixing bowl. ${state.ingredients.length} ingredients added.`:`${K.icing.find(x=>x[0]===state.icing)[1]} cupcake with ${state.toppings.length} toppings.`);
 document.querySelector('.scene').classList.toggle('served',served);
 ['mix','decorate','served'].forEach(step=>$('step-'+step).classList.toggle('active',step===state.stage));
 $('message').textContent=busy?'Your cupcake is baking…':served?'You made something wonderful. Ready for another?':decorating?'Choose icing and tap toppings. It’s your recipe!':state.ingredients.length<3?'Tap each ingredient to add it to the bowl.':state.mixes<4?'Tap Mix it! to stir your cupcake batter.':'Lovely mixing! Your cupcake is ready for the oven.';
 $('bonus').setAttribute('aria-pressed',String(state.bonus));$('bonus').disabled=served;$('bonus').textContent=state.bonus?'Free play':'Try it';$('order-copy').textContent=state.bonus?'A little challenge, only if you fancy it. Extra decorations are welcome!':'Make it your way, or follow an order for +10 bonus coins.';
 $('order-details').hidden=!state.bonus;const t=K.ticket(state),ic=K.icing.find(x=>x[0]===t.icing),top=K.toppings.find(x=>x[0]===t.topping);
 $('order-details').innerHTML=`<b style="color:${t.icing==='white'?'#846c4b':ic[2]}">${ic[1]} icing</b><br>${top[2]} ${top[1]} × ${t.count} &nbsp; <b>+10 🪙</b>`;
 document.querySelectorAll('[data-icing]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.icing===state.icing)));
 document.querySelectorAll('[data-topping]').forEach(b=>b.disabled=state.toppings.length>=24);
 $('undo').disabled=$('clear').disabled=!state.toppings.length;
 $('topping-counts').textContent=K.toppings.map(x=>{const n=state.toppings.filter(t=>t.kind===x[0]).length;return n?`${x[2]} × ${n}`:'';}).filter(Boolean).join('  ');
 $('reward').textContent=served?`+5 coins for your creation${state.servedReward.bonus?' + 10 bonus coins for your order!':'!'} 🪙`:'';
 $('plates').innerHTML=K.plates.map((p,i)=>`<button class="plate-option" data-plate="${i}" aria-label="${p.name} plate${state.coins<p.at?`, unlocks at ${p.at} coins`:''}" title="${p.name}${state.coins<p.at?` · ${p.at} coins`:''}" aria-pressed="${state.plate===i}" ${state.coins<p.at?'disabled':''}><span class="disk" style="background:${i===4?'linear-gradient(90deg,#f5a4c9,#ffe6a4,#b3debd,#b7c8fa)':p.colour}"></span>${state.coins<p.at?`<small>🔒${p.at}</small>`:''}</button>`).join('');
 $('plates').querySelectorAll('[data-plate]').forEach(b=>b.addEventListener('click',()=>dispatch('plate',Number(b.dataset.plate))));
 const next=K.plates.find(p=>p.at>state.coins);$('plate-progress').textContent=next?`${next.at-state.coins} coins to ${next.name}`:'All plates unlocked!';
}
K.icing.forEach(([id,name,colour])=>{const b=document.createElement('button');b.className='icing';b.style.background=colour;b.dataset.icing=id;b.setAttribute('aria-label',name+' icing');b.title=name;b.addEventListener('click',()=>dispatch('icing',id));$('icings').append(b);});
K.toppings.forEach(([id,name,emoji])=>{const b=document.createElement('button');b.dataset.topping=id;b.innerHTML=emoji+`<small>${name}</small>`;b.setAttribute('aria-label','Add '+name);b.addEventListener('click',()=>dispatch('topping',id));$('toppings').append(b);});
document.querySelectorAll('[data-guest]').forEach(b=>b.addEventListener('click',()=>dispatch('guest',b.dataset.guest)));
document.querySelectorAll('[data-ingredient]').forEach(b=>b.addEventListener('click',()=>dispatch('ingredient',b.dataset.ingredient)));
$('mix').addEventListener('click',()=>{if(busy)return;dispatch('mix');const scene=document.querySelector('.scene');scene.classList.remove('mixing');void scene.offsetWidth;scene.classList.add('mixing');});
$('bake').addEventListener('click',()=>{if(busy||state.mixes!==4||state.stage!=='mix')return;busy=true;document.querySelector('.scene').classList.add('baking');render();setTimeout(()=>{busy=false;document.querySelector('.scene').classList.remove('baking');dispatch('bake');chime();},950);});
for(const name of ['undo','clear','serve','next','bonus'])$(name).addEventListener('click',()=>dispatch(name));
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('sound').textContent=sound?'🔊 Sound':'🔇 Sound';if(sound)chime();});
$('sparkles').innerHTML=Array.from({length:12},(_,i)=>`<span style="left:${8+i*7}%;top:${15+(i*17)%60}%">${['✨','⭐','💛'][i%3]}</span>`).join('');
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
$('picture').addEventListener('click',async()=>{
 const button=$('picture');button.disabled=true;const snapshot=JSON.parse(JSON.stringify(state));
 let url;
 try{
 const svg=KitchenArt.svg(snapshot,K);url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 const [food,guest]=await Promise.all([loadImage(url),loadImage(`/play/dress-up/assets/${snapshot.guest}.png`)]);
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=800;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff5e5';ctx.fillRect(0,0,1000,800);ctx.fillStyle='#71513d';ctx.textAlign='center';ctx.font='bold 44px Arial';ctx.fillText('Cone Valley Kitchen',500,80);ctx.font='24px Arial';ctx.fillText('Made with imagination ♡',500,120);ctx.drawImage(guest,610,195,330,370);ctx.drawImage(food,20,210,700,560);ctx.font='bold 20px Arial';ctx.fillText('CONE KiDS · Cone Valley Kitchen',500,760);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Export');const download=URL.createObjectURL(blob),a=document.createElement('a');a.href=download;a.download='cone-valley-kitchen.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(download),1000);$('message').textContent='Your kitchen picture is ready to save. Check your downloads.';
 }catch(e){$('message').textContent='Your picture couldn’t save this time. You can try again.';}finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}
});
render();
