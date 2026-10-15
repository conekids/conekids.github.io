(function(root){
'use strict';
function topping(kind,x,y,angle){
 let body='';
 if(kind==='strawberry')body='<path d="M-13-6Q-22 0-8 18Q0 29 8 18Q22 0 13-6Q0-15-13-6" fill="#ef4d57" stroke="#cb3442" stroke-width="2"/><path d="M0-5L-12-15-7-4-1-13 5-3 13-13 10-2" fill="#64a65a"/><g fill="#ffe3a0"><ellipse cx="-8" cy="2" rx="1.4" ry="2"/><ellipse cx="5" cy="3" rx="1.4" ry="2"/><ellipse cx="-3" cy="13" rx="1.4" ry="2"/></g>';
 if(kind==='blueberry')body='<circle r="13" fill="#6465aa" stroke="#454781" stroke-width="2"/><path d="M-5-5L0-8 4-4 0-1Z" fill="#a5a9da"/><circle cx="-5" cy="-5" r="3" fill="#fff4"/>';
 if(kind==='star')body='<path d="M0-18L6-6 19-5 9 4 12 18 0 11-12 18-9 4-19-5-6-6Z" fill="#ffcf50" stroke="#e2a933" stroke-width="2"/>';
 if(kind==='chocolate')body='<path d="M0-17Q-2-7-13 7Q-19 20 0 20Q20 20 13 7Z" fill="#67402f" stroke="#4c2e23" stroke-width="2"/><path d="M-6 7L-2 0" stroke="#b2805c" stroke-width="4" stroke-linecap="round"/>';
 if(kind==='cherry')body='<path d="M0 0Q5-23 20-24" fill="none" stroke="#63884b" stroke-width="4"/><ellipse cx="13" cy="-19" rx="9" ry="4" fill="#89ae5b"/><circle cy="8" r="14" fill="#d64357" stroke="#b12e46" stroke-width="2"/><circle cx="-5" cy="3" r="4" fill="#ffb0a9"/>';
 if(kind==='sprinkles')body='<g stroke-width="5" stroke-linecap="round"><path d="M-16-7L-10-1M7 10L14 12" stroke="#f9cf4f"/><path d="M5-12L8-5M-10 12L-4 7" stroke="#48bcba"/><path d="M16-1L10 4M-4-5L0 0" stroke="#e55b8d"/></g>';
 return `<g transform="translate(${x} ${y}) rotate(${angle})">${body}</g>`;
}
function svg(s,K){
 const colour=K.icing.find(x=>x[0]===s.icing)[2],plate=K.plates[s.plate].colour;
 const defs='<defs><linearGradient id="rainbow"><stop stop-color="#f5a4c9"/><stop offset=".33" stop-color="#ffe6a4"/><stop offset=".66" stop-color="#b3debd"/><stop offset="1" stop-color="#b7c8fa"/></linearGradient><linearGradient id="wrapper" x2="0" y2="1"><stop stop-color="#f0b679"/><stop offset="1" stop-color="#ca8354"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#765338" flood-opacity=".16"/></filter></defs>';
 let content='';
 if(s.stage==='mix'){
 const icons={flour:'🌾',egg:'🥚',milk:'🥛'};
 content=`<ellipse cx="292" cy="390" rx="192" ry="25" fill="#694c2620"/><g filter="url(#shadow)"><ellipse cx="290" cy="260" rx="164" ry="52" fill="#81bdc6"/><path d="M126 260Q142 402 290 405Q438 402 454 260" fill="#92cbd0" stroke="#69a8b2" stroke-width="5"/><ellipse cx="290" cy="260" rx="161" ry="49" fill="#d6e9df"/><ellipse cx="290" cy="260" rx="139" ry="35" fill="${s.ingredients.length?'#efdab1':'#d6e9df'}"/><path d="M144 289Q164 362 225 375" stroke="#c9ece7" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M325 255L409 102" stroke="#a47346" stroke-width="18" stroke-linecap="round"/><ellipse cx="320" cy="262" rx="27" ry="15" fill="#bc8a56"/>${s.ingredients.map((n,i)=>`<text x="${180+i*77}" y="230" font-size="36">${icons[n]}</text>`).join('')}</g>`;
 }else{
 content=`<ellipse cx="290" cy="403" rx="212" ry="36" fill="${plate}" stroke="#fff9" stroke-width="6"/><ellipse cx="290" cy="398" rx="172" ry="24" fill="#fff4"/><g filter="url(#shadow)"><path d="M165 266Q158 226 190 212Q195 170 236 176Q257 137 291 158Q341 139 363 176Q406 181 414 222Q442 248 416 274Z" fill="#dfad70"/><path d="M166 273L196 390Q290 416 385 390L416 273Z" fill="url(#wrapper)" stroke="#b67952" stroke-width="3"/><g stroke="#b9794e" stroke-width="5" opacity=".5">${[0,1,2,3,4,5,6].map(i=>`<path d="M${183+i*36} 281L${204+i*28} 389"/>`).join('')}</g><path d="M153 263Q130 239 157 217Q143 190 187 181Q174 151 228 145Q216 120 266 104Q304 81 296 64Q346 85 337 117Q390 121 380 151Q429 159 417 185Q458 206 433 230Q456 263 416 273Q373 284 349 270Q312 290 280 274Q245 294 210 274Q172 286 153 263Z" fill="${colour}" stroke="#0000000c" stroke-width="3"/><g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"><path d="M174 228Q277 259 403 228"/><path d="M200 184Q290 208 387 182"/><path d="M244 143Q294 161 346 140"/></g>${s.toppings.map((t,i)=>{const r=Math.sqrt((i+.5)/24),a=i*2.399963;return topping(t.kind,Math.round(292+Math.cos(a)*112*r),Math.round(194+Math.sin(a)*66*r),(i*37)%45-22);}).join('')}</g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="480" viewBox="0 0 600 480">${defs}${content}</svg>`;
}
const api={svg};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KitchenArt=api;
})(typeof globalThis!=='undefined'?globalThis:this);
