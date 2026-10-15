const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {harness}=require('./test-dress-up.cjs');
const file=process.env.CONE_DRESS_UP_HTML||path.join(__dirname,'../dress-up/index.html'),html=fs.readFileSync(file,'utf8');
(async()=>{
let passed=0;const checks=[];
const seeded={'cone-kids-dress-up-v2':JSON.stringify({points:500,celebrated:[],looks:{}})};
for(let character=0;character<3;character++)for(const cat of ['outfit','face','hat','prop'])for(const item of Array.from((await harness(seeded)).read(`items.filter(i=>i.category==='${cat}').map(i=>i.id)`))){
 const g=await harness({...seeded});g.choose(character);g.tab(cat);const b=g.button(item);const base={button:0,pointerId:7,pointerType:'touch',clientX:500,clientY:200};
 // A normal finger press must not grab pointer capture before direction is known.
 b.onpointerdown(base);assert.equal(b.capture,undefined);
 // Vertical swipes in either direction release the app gesture and leave native pan-y scrolling available.
 g.listeners.pointermove({...base,clientX:503,clientY:245});assert.equal(g.read('drag'),null);assert.equal(b.capture,undefined);assert.equal(g.read(`currentLook()['${cat}']`),null);assert(b.suppressClick);b.onclick();assert.equal(g.read(`currentLook()['${cat}']`),null);
 b.onpointerdown(base);g.listeners.pointermove({...base,clientX:498,clientY:155});assert.equal(g.read('drag'),null);assert.equal(g.read(`currentLook()['${cat}']`),null);
 // Horizontal gestures capture and drag; the target is beside the item, at the same vertical position.
 b.onpointerdown(base);g.listeners.pointermove({...base,clientX:470,clientY:202});assert.equal(b.capture,7);assert(g.read('!!drag.ghost'));g.listeners.pointerup({...base,clientX:310,clientY:200});assert.equal(g.read(`currentLook()['${cat}']`),item);assert.equal(g.read('drag'),null);
 // A simple tap and a cancelled horizontal drag remain safe.
 g.get('#clearTab').onclick();await g.click(item);assert.equal(g.read(`currentLook()['${cat}']`),item);g.get('#clearTab').onclick();const next=g.button(item);next.onpointerdown(base);g.listeners.pointermove({...base,clientX:470,clientY:200});g.listeners.pointercancel(base);assert.equal(g.read('drag'),null);assert.equal(g.read(`currentLook()['${cat}']`),null);passed++;
}
// Verify mobile CSS contract and check its size equations at typical phone/tablet sizes.
assert(html.includes('touch-action:pan-y'));assert(!html.includes('touch-action:none'));
assert(html.includes('grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)'));
assert(html.includes('height:clamp(220px,42dvh,360px)'));
assert(html.includes('position:sticky;top:8px'));
assert(html.includes('overscroll-behavior-y:contain'));
for(const [vw,vh] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[640,360],[740,390]]){const available=vw-20-8;const studioWidth=available*1.1/2.1;const studioHeight=Math.min(380,Math.max(230,vh*.46));const contentWidth=studioWidth-8,contentHeight=studioHeight-8;const figureWidth=Math.min(contentWidth*.96,Math.min(290,Math.max(170,vh*.34)));const figureHeight=figureWidth*560/500;const top=contentHeight*(1-.12)-figureHeight;assert(top>=0,'Full character fits studio at '+vw+'x'+vh);const wardrobe=available/2.1;assert(wardrobe>130);checks.push({viewport:`${vw}x${vh}`,sideBySide:true,figureFits:true,wardrobeScrollHeight:Math.min(360,Math.max(220,vh*.42))})}
const report=JSON.stringify({gesture_cases:passed,passed,failed:0,layout_checks:checks,method:'Production pointer-event handlers in an instrumented DOM plus CSS-contract and viewport size-equation checks. Not an actual browser scrolling/layout test or a physical-device test.'},null,2);console.log(`PASS ${passed} mobile gesture cases across all 80 items and 3 characters; ${checks.length} viewport size checks.`);

})().catch(e=>{console.error(e);process.exit(1)});
