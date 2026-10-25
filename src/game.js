// ---------- the footpath game: walk 100 m of a Gurugram footpath without stepping onto the road ----------
// Chrome-dinosaur rules on our own street: the walker from the drawn strip, the obstacles from the palette (obs.js),
// tap to jump, hold to duck. Everything is drawn on a canvas from SVG the site already has; nothing is loaded from anywhere.
const TOK={paver:'#E6E1D6',line:'#CFC9BC',ink:'#1C1E21',ink2:'#5B5A54',plot:'#F6F3EC',plot2:'#CFC7B8',asphalt:'#2B2E33',chalk:'#FFFFFF',dirt:'#C9B08A',dirt2:'#B39A74',tree:'#6E8B3D',glow:'#FFD24D',water:'#8DB9DA',yellow:'#FFC72C','yellow-ink':'#1C1E21',red:'#DE3A2F',amber:'#EE8B22',green:'#1FAE5A',bg:'#EFEBE3'};
const GS={
 en:{title:'The footpath game',sub:'Walk 100 m without stepping onto the road. Tap or press space to jump. Hold the Duck button or the down arrow to duck. It is harder than it should be.',start:'Tap to start walking',jump:'Jump',duck:'Duck',m:'m',best:'best',over:'You stepped onto the road at',passed:'100 m without stepping onto the road. The Court’s test: passed.',again:'Walk again',real:'Check a real street',share:'Share your distance',shared:'Copied',sharetext:(m)=>`I walked ${m} m of a Gurugram footpath before it put me on the road. The Supreme Court’s test is 100 m. Try it: https://righttowalk.life/game.html`,
  joke:{parked:'A car parked across the footpath. It is “just for two minutes”.',vendor:'A chai stall. Honestly, worth stopping for. Still not a footpath.',shop:'The shop’s goods have spread to the kerb. So has the shop.',ramp:'A private ramp. The house is private. The footpath was not.',manhole:'An open manhole. The one thing on this footpath that is not funny.',slab:'A missing slab. The paver is now in somebody’s garden.',dug:'Dug up for a cable in 2024. The cable is fine.',waste:'Malba. Somebody’s bathroom is being renovated, on your footpath.',water:'Waterlogged. The drain is under the hoarding.',cattle:'A cow. She has right of way. Legally debatable, practically settled.',riding:'A scooter on the footpath. He is “just going a little ahead”.',shrine:'A shrine. Divine intervention does not cover footpaths.',wire:'A cable at head height. The pole is on the footpath too.',branch:'A branch at head height. The tree was here first; the footpath should have gone around it.',hoarding:'A hoarding at head height, selling 4 BHK luxury living facing the road you now stand on.',road:'You stepped onto the road. So does everyone. That is the point.'}},
 hi:{title:'फुटपाथ का खेल',sub:'सड़क पर उतरे बिना 100 मीटर चलें। कूदने के लिए टैप करें या स्पेस दबाएँ। झुकने के लिए “झुकें” बटन या नीचे वाला तीर दबाए रखें। यह जितना होना चाहिए, उससे मुश्किल है।',start:'चलना शुरू करने के लिए टैप करें',jump:'कूदें',duck:'झुकें',m:'मी',best:'सबसे ज़्यादा',over:'आप सड़क पर उतर गए',passed:'सड़क पर उतरे बिना 100 मीटर। कोर्ट की कसौटी: पास।',again:'फिर चलें',real:'असली सड़क जाँचें',share:'अपनी दूरी साझा करें',shared:'कॉपी हो गया',sharetext:(m)=>`मैं गुरुग्राम के फुटपाथ पर ${m} मीटर चला, फिर उसने मुझे सड़क पर उतार दिया। सुप्रीम कोर्ट की कसौटी 100 मीटर है। आज़माएँ: https://righttowalk.life/game.html`,
  joke:{parked:'फुटपाथ पर आड़ी खड़ी गाड़ी। “बस दो मिनट के लिए”।',vendor:'चाय की दुकान। सच कहें तो रुकने लायक। फिर भी फुटपाथ नहीं।',shop:'दुकान का सामान कर्ब तक फैल गया। दुकान भी।',ramp:'निजी रैंप। घर निजी है। फुटपाथ नहीं था।',manhole:'खुला मैनहोल। इस फुटपाथ पर एक यही चीज़ है जो मज़ाक नहीं है।',slab:'गायब स्लैब। पेवर अब किसी के बग़ीचे में है।',dug:'2024 में केबल के लिए खोदा गया। केबल ठीक है।',waste:'मलबा। किसी का बाथरूम बन रहा है, आपके फुटपाथ पर।',water:'जलभराव। नाली होर्डिंग के नीचे है।',cattle:'एक गाय। रास्ता उसका है। क़ानूनन बहस है, व्यवहार में तय।',riding:'फुटपाथ पर स्कूटर। “बस थोड़ा आगे जा रहा हूँ”।',shrine:'एक मंदिर। ईश्वरीय कृपा फुटपाथ तक नहीं पहुँचती।',wire:'सिर की ऊँचाई पर तार। खंभा भी फुटपाथ पर है।',branch:'सिर की ऊँचाई पर टहनी। पेड़ पहले से था; फुटपाथ को घूमकर जाना चाहिए था।',hoarding:'सिर की ऊँचाई पर होर्डिंग, 4 BHK लग्ज़री बेच रही है, उसी सड़क की ओर जिस पर अब आप खड़े हैं।',road:'आप सड़क पर उतर गए। सब उतरते हैं। बात यही है।'}}
};
let lang=(()=>{try{return localStorage.getItem('fc_lang')||'en'}catch(e){return 'en'}})();if(!GS[lang])lang='en';
const T=k=>GS[lang][k];
const $=id=>document.getElementById(id);
const W=1000,H=300,GROUND=200,WX=150,PXM=30;let VW=W;   // canvas units; footpath surface; walker x; px per metre
const GROUNDOBS=[['parked',96,58],['vendor',100,76],['shop',84,68],['ramp',90,48],['manhole',56,22],['slab',66,30],['dug',92,32],['waste',70,42],['water',94,14],['cattle',84,52],['riding',64,62],['shrine',64,92]];
const OVEROBS=[['wire',80],['branch',76],['hoarding',90]];
const svgTok=s=>s.replace(/var\(--s-([a-z0-9-]+)\)/g,(m,k)=>TOK[k]||'#000');
function img(svg){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)})}
// ---- drawings: the palette glyphs sit on a baseline b with x at centre; we render each into a 200 x 160 image ----
function groundSVG(id){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">${svgTok(obsGlyph(id,100,150))}</svg>`}
function overSVG(id){const b=150;let g='';
 if(id==='wire')g=`<rect x="12" y="${b-150}" width="8" height="150" fill="${TOK.ink}"/><rect x="180" y="${b-150}" width="8" height="150" fill="${TOK.ink}"/><rect x="0" y="${b-148}" width="32" height="5" fill="${TOK.ink}"/><rect x="168" y="${b-148}" width="32" height="5" fill="${TOK.ink}"/>${[0,8,16,24,32,40].map(d=>`<path d="M16 ${b-144+d} Q100 ${b-20+d*0.6} 184 ${b-144+d}" fill="none" stroke="${d%16?TOK.ink2:TOK.ink}" stroke-width="3"/>`).join('')}<rect x="84" y="${b-96}" width="32" height="22" rx="3" fill="${TOK.ink2}" stroke="${TOK.ink}" stroke-width="2"/><path d="M94 ${b-91} l6 6 l-6 6" fill="none" stroke="${TOK.yellow}" stroke-width="2"/>`;
 else if(id==='branch')g=`<rect x="170" y="${b-150}" width="18" height="150" fill="${TOK.dirt2}"/><path d="M178 ${b-120} Q120 ${b-100} 40 ${b-70}" fill="none" stroke="${TOK.dirt2}" stroke-width="10" stroke-linecap="round"/><ellipse cx="70" cy="${b-78}" rx="52" ry="26" fill="${TOK.tree}"/><ellipse cx="110" cy="${b-108}" rx="50" ry="28" fill="${TOK.tree}"/><ellipse cx="60" cy="${b-120}" rx="44" ry="24" fill="${TOK.tree}"/><circle cx="170" cy="${b-140}" r="34" fill="${TOK.tree}"/>`;
 else g=`<rect x="20" y="${b-150}" width="10" height="150" fill="${TOK.ink}"/><rect x="170" y="${b-150}" width="10" height="150" fill="${TOK.ink}"/><rect x="10" y="${b-150}" width="180" height="100" fill="${TOK.chalk}" stroke="${TOK.ink}" stroke-width="4"/><rect x="24" y="${b-134}" width="90" height="14" fill="${TOK.red}"/><rect x="24" y="${b-110}" width="150" height="9" fill="${TOK.ink2}"/><rect x="24" y="${b-94}" width="120" height="9" fill="${TOK.ink2}"/><rect x="24" y="${b-78}" width="80" height="9" fill="${TOK.yellow}"/><rect x="24" y="${b-64}" width="150" height="6" fill="${TOK.ink2}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">${g}</svg>`}
function walkerSVG(pose,color){const c=color||TOK.ink;let body='';
 if(pose==='walk1')body=`<circle cx="0" cy="-29" r="7" fill="${c}"/><path d="M0 -21V-2 M0 -20L-10 -8M0 -20L10 -10 M0 -2L-9 14M0 -2L9 14" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
 else if(pose==='walk2')body=`<circle cx="0" cy="-29" r="7" fill="${c}"/><path d="M0 -21V-2 M0 -20L-4 -6M0 -20L6 -4 M0 -2L-3 15M0 -2L4 15" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
 else if(pose==='jump')body=`<circle cx="0" cy="-31" r="7" fill="${c}"/><path d="M0 -23V-4 M0 -22L-11 -14M0 -22L11 -16 M0 -4L-9 4L-4 12 M0 -4L8 3L4 12" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
 else if(pose==='duck')body=`<circle cx="4" cy="-18" r="7" fill="${c}"/><path d="M2 -11L-2 -2 M0 -8L-9 -3M0 -8L9 -5 M-2 -2L-10 10M-2 -2L8 10" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
 else body=`<circle cx="0" cy="-29" r="7" fill="${c}"/><path d="M0 -21V-2 M0 -20L-7 -6M0 -20L7 -6 M0 -2L-4 14M0 -2L4 14" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-22 -44 44 62" width="88" height="124">${body}</svg>`}
const IMG={};
async function loadAll(){const jobs=[];for(const [id] of GROUNDOBS)jobs.push(img(groundSVG(id)).then(i=>IMG[id]=i));for(const [id] of OVEROBS)jobs.push(img(overSVG(id)).then(i=>IMG[id]=i));for(const p of ['walk1','walk2','jump','duck','stand'])jobs.push(img(walkerSVG(p)).then(i=>IMG['w_'+p]=i));jobs.push(img(walkerSVG('stand',TOK.red)).then(i=>IMG.w_fallen=i));await Promise.all(jobs)}
// ---- state ----
let cv,ctx,scale=1,state='idle',t0=0,last=0,dist=0,speed=0,obs=[],nextAt=0,wy=0,vy=0,ducking=false,walkT=0,hit=null,best=0,flash=0,car=null,passedShown=false,raf=0;
const G=2400,V0=-760;
function reset(){dist=0;speed=300;obs=[];nextAt=700;wy=0;vy=0;ducking=false;walkT=0;hit=null;flash=0;passedShown=false;car={x:VW+200,v:0}}
function spawn(){const over=Math.random()<0.28&&dist>900;let o;if(over){const [id,w]=OVEROBS[Math.floor(Math.random()*OVEROBS.length)];o={id,kind:'over',x:VW+120,w,h:98}}else{const [id,w,h]=GROUNDOBS[Math.floor(Math.random()*GROUNDOBS.length)];o={id,kind:'ground',x:VW+120,w,h}}obs.push(o);
 const gentle=dist<2400?220:0;nextAt=dist+gentle+360+Math.random()*420+speed*0.55}
function walkerBox(){const h=ducking&&wy===0?46:82;return {x:WX-16,y:GROUND-h-(-wy),w:32,h}}   // wy is negative when in the air (canvas y up is smaller)
function obsBox(o){if(o.kind==='over')return {x:o.x-o.w/2,y:GROUND-150,w:o.w,h:98};return {x:o.x-o.w/2,y:GROUND-o.h,w:o.w,h:o.h}}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function metres(){return Math.floor(dist/PXM)}
function jump(){if(state==='idle'){start();return}if(state==='over'){start();return}if(wy===0&&!ducking){vy=V0;wy=-0.01}}
function start(){reset();state='running';last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);$('g-over').hidden=true;$('g-start').hidden=true}
function gameOver(id){state='over';hit=id;const m=metres();if(m>best){best=m;try{localStorage.setItem('fc_game_best',String(best))}catch(e){}}
 const box=$('g-over');box.hidden=false;$('g-over-h').textContent=`${T('over')} ${m} ${T('m')}`;$('g-over-p').textContent=T('joke')[id]||T('joke').road;$('g-over-best').textContent=`${T('best')}: ${best} ${T('m')}`;$('g-share').hidden=!m;drawFrame()}
function loop(now){if(state!=='running')return;const dt=Math.min(0.05,(now-last)/1000);last=now;
 speed=Math.min(640,speed+8*dt);dist+=speed*dt;walkT+=dt;
 if(wy<0||vy<0){vy+=G*dt;wy+=vy*dt;if(wy>=0){wy=0;vy=0}}
 for(const o of obs)o.x-=speed*dt;obs=obs.filter(o=>o.x>-160);
 if(dist>=nextAt)spawn();
 if(car){car.x-=(speed*1.7+120)*dt;if(car.x<-200)car.x=VW+400+Math.random()*1200}
 if(!passedShown&&metres()>=100){passedShown=true;flash=2.2}
 if(flash>0)flash-=dt;
 const wb=walkerBox();for(const o of obs){if(overlap(wb,obsBox(o))){gameOver(o.id);return}}
 drawFrame();raf=requestAnimationFrame(loop)}
function drawFrame(){const c=ctx;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,VW,H);
 c.fillStyle=TOK.plot;c.fillRect(0,0,VW,40);
 // pavers, scrolling
 c.fillStyle=TOK.paver;c.fillRect(0,40,VW,GROUND-40);c.strokeStyle=TOK.line;c.lineWidth=1.5;const off=-(dist%40);c.beginPath();for(let y=40;y<=GROUND;y+=22){c.moveTo(0,y);c.lineTo(VW,y)}for(let x=off;x<VW+40;x+=40){for(let y=40,k=0;y<GROUND;y+=22,k++){const sx=x+(k%2?20:0);c.moveTo(sx,y);c.lineTo(sx,Math.min(y+22,GROUND))}}c.stroke();
 // kerb and road
 for(let x=-(dist%80);x<VW+80;x+=80){c.fillStyle=TOK.yellow;c.fillRect(x,GROUND,40,12);c.fillStyle=TOK.ink;c.fillRect(x+40,GROUND,40,12)}
 c.fillStyle=TOK.asphalt;c.fillRect(0,GROUND+12,VW,H-GROUND-12);c.strokeStyle=TOK.chalk;c.globalAlpha=.55;c.lineWidth=3;c.setLineDash([40,30]);c.lineDashOffset=dist%70;c.beginPath();c.moveTo(0,GROUND+56);c.lineTo(VW,GROUND+56);c.stroke();c.setLineDash([]);c.globalAlpha=1;
 // a car on the road
 if(car){const x=car.x;c.fillStyle=TOK.chalk;c.globalAlpha=.85;c.beginPath();c.roundRect(x,GROUND+66,70,26,8);c.fill();c.beginPath();c.roundRect(x+12,GROUND+58,42,14,5);c.fill();c.globalAlpha=1;c.fillStyle=TOK.ink;c.beginPath();c.arc(x+16,GROUND+94,7,0,7);c.arc(x+54,GROUND+94,7,0,7);c.fill()}
 // obstacles
 for(const o of obs){const im=IMG[o.id];if(im)c.drawImage(im,o.x-100,GROUND-150,200,160);if(o.kind==='over'){/* the hazard band is drawn in the image */}}
 // walker
 let pose='stand';if(state==='running'){pose=wy<0?'jump':(ducking?'duck':(Math.floor(walkT*8)%2?'walk1':'walk2'))}
 if(state==='over'){const im=IMG.w_fallen;c.strokeStyle=TOK.red;c.lineWidth=4;c.setLineDash([8,6]);c.beginPath();c.moveTo(WX,GROUND-40);c.quadraticCurveTo(WX+40,GROUND+10,WX+70,GROUND+70);c.stroke();c.setLineDash([]);if(im)c.drawImage(im,WX+70-44,GROUND+74-124+32,88,124);c.fillStyle=TOK.red;c.font='700 22px Khand, sans-serif';c.fillText('HONK',car?Math.max(20,Math.min(VW-90,car.x)):VW-120,GROUND+50)}
 else{const im=IMG['w_'+pose];if(im)c.drawImage(im,WX-44,GROUND+wy-124+32,88,124)}
 // HUD
 c.fillStyle=TOK.ink;c.font='700 26px Khand, sans-serif';c.textAlign='right';c.fillText(`${metres()} ${T('m')}`,VW-20,32);c.font='600 15px Khand, sans-serif';c.fillStyle=TOK.ink2;c.fillText(`${T('best')} ${best} ${T('m')}`,VW-20,54);c.textAlign='left';
 if(flash>0){c.globalAlpha=Math.min(1,flash);c.fillStyle=TOK.green;c.font='700 30px Khand, sans-serif';c.textAlign='center';c.fillText(T('passed'),VW/2,100);c.textAlign='left';c.globalAlpha=1}
}
function fit(){const box=$('g-wrap');const w=box.clientWidth;VW=w<640?640:W;scale=w/VW;cv.width=Math.round(VW*scale*devicePixelRatio);cv.height=Math.round(H*scale*devicePixelRatio);cv.style.height=Math.round(H*scale)+'px';scale*=devicePixelRatio;if(state!=='running')drawFrame()}
function applyStrings(){$('g-title').textContent=T('title');$('g-sub').textContent=T('sub');$('g-jump').textContent=T('jump');$('g-duck').textContent=T('duck');$('g-again').textContent=T('again');$('g-real').textContent=T('real');$('g-share').textContent=T('share');$('g-start').textContent=T('start');const b=$('langbtn');if(b)b.textContent=lang==='en'?'हिंदी':'English';document.documentElement.lang=lang==='hi'?'hi':'en';if(state==='over'&&hit!=null)gameOver(hit);else if(state!=='running')drawFrame()}
async function share(){const m=metres();const text=T('sharetext')(m);try{if(navigator.share){await navigator.share({text});return}}catch(e){if(e&&e.name==='AbortError')return}try{await navigator.clipboard.writeText(text);$('g-share').textContent=T('shared');setTimeout(()=>$('g-share').textContent=T('share'),1500)}catch(e){}}
async function init(){cv=$('g-canvas');ctx=cv.getContext('2d');try{best=+(localStorage.getItem('fc_game_best')||0)||0}catch(e){}await loadAll();reset();fit();applyStrings();
 window.addEventListener('resize',fit);window.addEventListener('load',fit);setTimeout(fit,60);setTimeout(fit,600);
 cv.addEventListener('pointerdown',e=>{e.preventDefault();jump()});
 $('g-jump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
 const duckOn=e=>{e.preventDefault();if(state==='running')ducking=true},duckOff=()=>{ducking=false};
 $('g-duck').addEventListener('pointerdown',duckOn);['pointerup','pointerleave','pointercancel'].forEach(ev=>$('g-duck').addEventListener(ev,duckOff));
 document.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump()}if(e.code==='ArrowDown'){e.preventDefault();if(state==='running')ducking=true}});
 document.addEventListener('keyup',e=>{if(e.code==='ArrowDown')ducking=false});
 $('g-again').addEventListener('click',start);$('g-share').addEventListener('click',share);$('g-start').addEventListener('click',jump);
 const lb=$('langbtn');if(lb)lb.addEventListener('click',()=>{lang=lang==='en'?'hi':'en';try{localStorage.setItem('fc_lang',lang)}catch(e){}applyStrings()});
 // pause when the tab is hidden (?nopause in the URL keeps it running, for automated play-tests)
 const nopause=/[?&]nopause/.test(location.search);document.addEventListener('visibilitychange',()=>{if(!nopause&&document.hidden&&state==='running'){state='idle';$('g-start').hidden=false;drawFrame()}})}
init();
