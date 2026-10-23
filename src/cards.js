// ---------- awareness cards: four 1080×1350 pictures for WhatsApp, drawn on a canvas on the device ----------
// Same frame as the per-check share card in share.js (paper, kerb stripe, Khand headline, yellow footer) and the same
// helpers (shareFonts, stripImage, wrapText, rr, fitFont, SHARE_TOK). Each card follows the page language. Nothing is
// uploaded: the PNG is made here and handed to the Web Share sheet or downloaded.
const CARDS_S={
 en:{
  kick:'RIGHT TO WALK',cta:'Check your street in two minutes',dl:'Download',
  a:{cap:'Your right',file:'right',kick:'SUPREME COURT OF INDIA',l1:'Walking on a footpath',l2:'is your right',
     quote:'“If the road exists, there is a duty to ensure that there are demarcated and well-maintained footpaths for walkers.”',gloss:'',
     cite:'Supreme Court of India, Maniyar Iliyaz v. P. Ayyappan, 2026 INSC 647, 19 June 2026, para 20(b)',
     pill:'A fundamental right · Article 19(1)(d)',sub:'The Court says walking has priority over movement by motorised vehicles.',pill2:'Part of the right to life · Article 21',sub2:'Footpaths in good condition are part of Article 21. Supreme Court, S. Rajaseekaran v. Union of India, 14 May 2025.',
     text:'Walking on a footpath is your right. Supreme Court of India, 19 June 2026. Check your street in two minutes: https://righttowalk.life'},
  b:{cap:'The number',file:'36526',kick:'INDIA · 2024',n:'36,526',l1:'pedestrians killed',l2:'on Indian roads in 2024',day:'About a hundred a day. Provisional figure.',
     hn:'866',hl:'in Haryana',src:'Source: Ministry of Road Transport and Highways, Rajya Sabha answer, 18 March 2026.',each:'Every one of them had a right to a footpath.',
     text:'36,526 pedestrians were killed on Indian roads in 2024, 866 of them in Haryana (Ministry of Road Transport and Highways, Rajya Sabha, 18 March 2026). Check your street: https://righttowalk.life'},
  c:{cap:'The 100 m test',file:'100m',kick:'THE 100 M TEST',l1:'A footpath you cannot',l2:'stay on for 100 m',l3:'is not a footpath',
     sub:'Our test for the Court’s words: walk 100 m on one side without stepping onto the road. If you cannot, the road owner has not provided the footpath the Court says it must.',
     cite:'Supreme Court of India, 19 June 2026: “demarcated and well-maintained footpaths for walkers”',
     text:'A footpath you cannot stay on for 100 m is not a footpath. Check yours in two minutes: https://righttowalk.life'},
  d:{cap:'Whose failure',file:'vendor',kick:'WHOSE FAILURE?',l1:'A blocked footpath is',l2:'the road owner’s failure',l3:'not the vendor’s',
     z1:'Building line',z2:'Walking zone · 2 m clear',z3:'Vending and utility zone',z4:'Road',
     sub:'The duty to provide, demarcate and maintain a footpath lies with the agency that owns the road. Vending is lawful under the Street Vendors Act 2014 and belongs in a designed vending zone beside a clear walking zone, not in its place.',
     ask:'Ask for the footpath. Not for the vendor to go.',
     text:'A blocked footpath is the road owner’s failure, not the vendor’s. Vending belongs in a vending zone under the Street Vendors Act 2014; the walking zone must be provided. Ask for the footpath: https://righttowalk.life'}
 },
 hi:{
  kick:'राइट टू वॉक',cta:'दो मिनट में अपनी सड़क जाँचें',dl:'डाउनलोड',
  a:{cap:'आपका हक़',file:'right-hi',kick:'सुप्रीम कोर्ट',l1:'फुटपाथ पर चलना',l2:'आपका हक़ है',
     quote:'“If the road exists, there is a duty to ensure that there are demarcated and well-maintained footpaths for walkers.”',
     gloss:'मतलब: जहाँ सड़क है, वहाँ चलने वालों के लिए चिह्नित और ठीक रखे हुए फुटपाथ देना एजेंसियों का कर्तव्य है।',
     cite:'सुप्रीम कोर्ट, Maniyar Iliyaz v. P. Ayyappan, 2026 INSC 647, 19 जून 2026, पैरा 20(b)',
     pill:'मौलिक अधिकार · अनुच्छेद 19(1)(d)',sub:'कोर्ट के मुताबिक़ पैदल चलने को मोटर गाड़ियों की आवाजाही पर प्राथमिकता है।',pill2:'जीने के अधिकार का हिस्सा · अनुच्छेद 21',sub2:'अच्छी हालत के फुटपाथ अनुच्छेद 21 का हिस्सा हैं। सुप्रीम कोर्ट, S. Rajaseekaran v. Union of India, 14 मई 2025।',
     text:'फुटपाथ पर चलना आपका हक़ है। सुप्रीम कोर्ट, 19 जून 2026। दो मिनट में अपनी सड़क जाँचें: https://righttowalk.life'},
  b:{cap:'आँकड़ा',file:'36526-hi',kick:'भारत · 2024',n:'36,526',l1:'पैदल चलने वाले',l2:'2024 में भारत की सड़कों पर मारे गए',day:'यानी रोज़ क़रीब सौ। अनंतिम आँकड़ा।',
     hn:'866',hl:'हरियाणा में',src:'स्रोत: सड़क परिवहन और राजमार्ग मंत्रालय, राज्यसभा में जवाब, 18 मार्च 2026।',each:'इनमें से हर एक को फुटपाथ का हक़ था।',
     text:'2024 में भारत की सड़कों पर 36,526 पैदल चलने वाले मारे गए, इनमें 866 हरियाणा में (सड़क परिवहन और राजमार्ग मंत्रालय, राज्यसभा, 18 मार्च 2026)। अपनी सड़क जाँचें: https://righttowalk.life'},
  c:{cap:'100 मीटर की कसौटी',file:'100m-hi',kick:'100 मीटर की कसौटी',l1:'जिस फुटपाथ पर',l2:'100 मीटर भी न चल सकें',l3:'वह फुटपाथ नहीं है',
     sub:'कोर्ट के शब्दों की हमारी कसौटी: एक तरफ़ 100 मीटर सड़क पर उतरे बिना चलें। न चल पाएँ, तो सड़क के मालिक ने वह फुटपाथ नहीं दिया जो कोर्ट के मुताबिक़ देना है।',
     cite:'सुप्रीम कोर्ट, 19 जून 2026: “demarcated and well-maintained footpaths for walkers”',
     text:'जिस फुटपाथ पर 100 मीटर भी न चल सकें, वह फुटपाथ नहीं है। दो मिनट में अपनी सड़क जाँचें: https://righttowalk.life'},
  d:{cap:'किसकी नाकामी',file:'vendor-hi',kick:'किसकी नाकामी?',l1:'रुका हुआ फुटपाथ',l2:'सड़क के मालिक की नाकामी है',l3:'रेहड़ी वाले की नहीं',
     z1:'इमारत की रेखा',z2:'चलने की जगह · 2 मीटर साफ़',z3:'वेंडिंग और यूटिलिटी ज़ोन',z4:'सड़क',
     sub:'फुटपाथ देना, चिह्नित करना और ठीक रखना उस एजेंसी का कर्तव्य है जिसकी सड़क है। रेहड़ी-पटरी Street Vendors Act 2014 के तहत क़ानूनी है और उसकी जगह एक तय वेंडिंग ज़ोन में है, चलने की साफ़ जगह के बग़ल में, उसकी जगह पर नहीं।',
     ask:'फुटपाथ माँगें। रेहड़ी हटाने की माँग नहीं।',
     text:'रुका हुआ फुटपाथ सड़क के मालिक की नाकामी है, रेहड़ी वाले की नहीं। रेहड़ी-पटरी की जगह Street Vendors Act 2014 के तहत वेंडिंग ज़ोन में है; चलने की जगह देना मालिक का काम है। फुटपाथ माँगें: https://righttowalk.life'}
 }
};
const CARD_IDS=['a','b','c','d'];
const cardCache={en:{},hi:{}};   // lang -> id -> {blob,url}
let cardsLang=null,cardsBusy=false;

// ---- frame pieces shared by the four cards ----
function cardCtx(){const W=1080,H=1350;const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.fillStyle=SHARE_TOK.bg;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,26);ctx.clip();for(let x=-40;x<W+40;x+=52){ctx.fillStyle=SHARE_TOK.yellow;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+26,0);ctx.lineTo(x+52,26);ctx.lineTo(x+26,26);ctx.closePath();ctx.fill();ctx.fillStyle=SHARE_TOK.ink;ctx.beginPath();ctx.moveTo(x+26,0);ctx.lineTo(x+52,0);ctx.lineTo(x+78,26);ctx.lineTo(x+52,26);ctx.closePath();ctx.fill()}ctx.restore();
 ctx.textBaseline='alphabetic';return {c,ctx,W,H}}
async function cardFontsReady(hi){const t=hi?'फुटपाथ':'A';try{await Promise.all([document.fonts.load('700 100px Khand',t),document.fonts.load('600 40px Khand',t),document.fonts.load('500 40px Mukta',t),document.fonts.load('400 34px Mukta',t),document.fonts.load('700 40px Mukta',t)])}catch(e){}}
const CARD_HEAD=`'Khand','Mukta',sans-serif`,CARD_BODY=`'Mukta',sans-serif`;
function cardKicker(ctx,hi,parts){ctx.fillStyle=SHARE_TOK.ink2;ctx.font=`600 32px ${CARD_HEAD}`;if(!hi&&'letterSpacing' in ctx)ctx.letterSpacing='4px';ctx.fillText(parts.join(' · '),60,96);if('letterSpacing' in ctx)ctx.letterSpacing='0px'}
// headline lines: {t, box:'yellow'|'ink'|'red'|null}; Devanagari gets taller boxes and line gaps for its matras
function cardHeadline(ctx,hi,lines,y,maxPx){const up=t=>hi?t:t.toUpperCase();let size=maxPx||100;for(const l of lines)size=Math.min(size,fitFont(ctx,up(l.t),l.box?920:960,size,48,700,CARD_HEAD));
 const lh=hi?1.16:0.98,bh=hi?1.26:1.06,bb=hi?0.96:0.84;
 for(const l of lines){const t=up(l.t);ctx.font=`700 ${size}px ${CARD_HEAD}`;
  if(l.box){const w=ctx.measureText(t).width;const bg=l.box==='yellow'?SHARE_TOK.yellow:(l.box==='red'?SHARE_TOK.red:SHARE_TOK.ink);ctx.fillStyle=bg;rr(ctx,60,y,w+40,size*bh,10);ctx.fill();ctx.fillStyle=l.box==='yellow'?SHARE_TOK.ink:SHARE_TOK.chalk;ctx.fillText(t,80,y+size*bb);y+=size*bh+14}
  else{ctx.fillStyle=SHARE_TOK.ink;ctx.fillText(t,60,y+size*(hi?0.9:0.82));y+=size*lh+14}}
 return y}
function cardPara(ctx,text,x,y,maxW,font,color,lh,max){ctx.font=font;ctx.fillStyle=color;const lines=wrapText(ctx,text,maxW);for(const ln of (max?lines.slice(0,max):lines)){ctx.fillText(ln,x,y+lh*0.78);y+=lh}return y}
function cardPill(ctx,hi,t,y){t=hi?t:t.toUpperCase();ctx.font=`600 ${hi?32:30}px ${CARD_HEAD}`;const pw=ctx.measureText(t).width+36;ctx.fillStyle=SHARE_TOK.ink;rr(ctx,60,y,pw,hi?52:46,8);ctx.fill();ctx.fillStyle=SHARE_TOK.chalk;ctx.fillText(t,78,y+(hi?38:33));return y+(hi?52:46)}
function cardQuote(ctx,hi,q,y){ctx.font=`600 ${hi?40:48}px ${CARD_HEAD}`;const ql=wrapText(ctx,q,900);const lh=hi?54:56;ctx.fillStyle=SHARE_TOK.yellow;ctx.fillRect(60,y,10,ql.length*lh+12);ctx.fillStyle=SHARE_TOK.ink;let yy=y;for(const ln of ql){ctx.fillText(ln,96,yy+lh*0.78);yy+=lh}return yy+12}
function cardFooter(ctx,W,H,hi,cta){const footTop=H-190;ctx.fillStyle=SHARE_TOK.yellow;ctx.fillRect(0,footTop,W,190);ctx.fillStyle=SHARE_TOK.ink;ctx.font=`600 ${hi?40:38}px ${CARD_HEAD}`;ctx.fillText(cta,60,footTop+72);ctx.font=`700 72px ${CARD_HEAD}`;ctx.fillText('righttowalk.life',60,footTop+150)}
function cardChip(ctx,x,y,text,dark,px){px=px||26;ctx.font=`600 ${px}px ${CARD_HEAD}`;const w=ctx.measureText(text).width+px*0.9,h=px*1.5;ctx.fillStyle=dark?SHARE_TOK.ink:SHARE_TOK.chalk;ctx.globalAlpha=.94;rr(ctx,x,y,w,h,px*0.3);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=dark?SHARE_TOK.chalk:SHARE_TOK.ink;ctx.fillText(text,x+px*0.45,y+px*1.08);return w}
function cardWalker(ctx,x,y,color,k){k=k||1;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,-29,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(0,-2);ctx.moveTo(0,-20);ctx.lineTo(-10,-8);ctx.moveTo(0,-20);ctx.lineTo(10,-10);ctx.moveTo(0,-2);ctx.lineTo(-9,14);ctx.moveTo(0,-2);ctx.lineTo(9,14);ctx.stroke();ctx.restore()}

// ---- (a) walking on a footpath is your right ----
async function drawCardA(L,hi){const {c,ctx,W,H}=cardCtx();cardKicker(ctx,hi,[CARDS_S[hi?'hi':'en'].kick,L.kick]);
 let y=cardHeadline(ctx,hi,[{t:L.l1},{t:L.l2,box:'yellow'}],140,104);y+=hi?22:34;
 y=cardQuote(ctx,hi,L.quote,y);
 if(L.gloss)y=cardPara(ctx,L.gloss,96,y+4,900,`500 30px ${CARD_BODY}`,SHARE_TOK.ink,40);
 y=cardPara(ctx,L.cite,96,y+4,900,`400 ${hi?26:27}px ${CARD_BODY}`,SHARE_TOK.ink2,hi?34:36)+(hi?24:30);
 const bf=`500 ${hi?34:37}px ${CARD_BODY}`,blh=hi?46:50,gap=hi?12:16;
 y=cardPill(ctx,hi,L.pill,y)+gap;y=cardPara(ctx,L.sub,60,y,960,bf,SHARE_TOK.ink,blh)+(hi?20:30);
 y=cardPill(ctx,hi,L.pill2,y)+gap;y=cardPara(ctx,L.sub2,60,y,960,bf,SHARE_TOK.ink,blh);
 cardFooter(ctx,W,H,hi,CARDS_S[hi?'hi':'en'].cta);return c}
// ---- (b) 36,526 ----
async function drawCardB(L,hi){const {c,ctx,W,H}=cardCtx();cardKicker(ctx,hi,[CARDS_S[hi?'hi':'en'].kick,L.kick]);
 ctx.fillStyle=SHARE_TOK.red;ctx.font=`700 300px ${CARD_HEAD}`;ctx.fillText(L.n,52,130+300*0.82);let y=130+300*0.98;
 y=cardHeadline(ctx,hi,[{t:L.l1,box:'ink'},{t:L.l2,box:'ink'}],y,76);
 y=cardPara(ctx,L.day,60,y+10,960,`500 36px ${CARD_BODY}`,SHARE_TOK.ink,48)+26;
 ctx.fillStyle=SHARE_TOK.red;ctx.font=`700 150px ${CARD_HEAD}`;ctx.fillText(L.hn,56,y+150*0.82);const hw=ctx.measureText(L.hn).width;ctx.fillStyle=SHARE_TOK.ink;ctx.font=`600 ${hi?48:44}px ${CARD_HEAD}`;ctx.fillText(hi?L.hl:L.hl.toUpperCase(),56+hw+28,y+150*0.82);y+=150*0.98+20;
 y=cardPara(ctx,L.src,60,y,960,`400 28px ${CARD_BODY}`,SHARE_TOK.ink2,38);
 const footTop=H-190;ctx.fillStyle=SHARE_TOK.ink;ctx.font=`600 ${hi?40:38}px ${CARD_HEAD}`;const el=wrapText(ctx,hi?L.each:L.each.toUpperCase(),960);let ey=Math.max(y+24,footTop-30-el.length*48);for(const ln of el){ctx.fillText(ln,60,ey+36);ey+=48}
 cardFooter(ctx,W,H,hi,CARDS_S[hi?'hi':'en'].cta);return c}
// ---- (c) the 100 m test, with the street strip from stripSVG: a walker forced onto the road ----
async function drawCardC(L,hi){const {c,ctx,W,H}=cardCtx();cardKicker(ctx,hi,[CARDS_S[hi?'hi':'en'].kick,L.kick]);
 let y=cardHeadline(ctx,hi,[{t:L.l1},{t:L.l2},{t:L.l3,box:'red'}],140,92);y+=26;
 const a={gate:'no',i1:'yes',i2:'no',i3:'no',i4:'no',i5:'yes',i6:'no',i7:'partly',i8:'no',i9:'no',i10:'no'};
 const svg=stripSVG(a,'found',{id:'ca',obs:['parked','electric','vendor','manhole'],labels:true,lblScale:1.5});
 const img=await stripImage(svg,hi);const sx=60,sw=960,sh=Math.round(sw*0.26);
 ctx.save();rr(ctx,sx,y,sw,sh,18);ctx.clip();ctx.fillStyle=SHARE_TOK.asphalt;ctx.fillRect(sx,y,sw,sh);if(img)ctx.drawImage(img,sx,y,sw,sh);ctx.restore();ctx.lineWidth=4;ctx.strokeStyle=SHARE_TOK.ink;rr(ctx,sx,y,sw,sh,18);ctx.stroke();y+=sh+36;
 y=cardPara(ctx,L.sub,60,y,960,`500 36px ${CARD_BODY}`,SHARE_TOK.ink,48)+14;
 y=cardPara(ctx,L.cite,60,y,960,`400 27px ${CARD_BODY}`,SHARE_TOK.ink2,36);
 cardFooter(ctx,W,H,hi,CARDS_S[hi?'hi':'en'].cta);return c}
// ---- (d) the vendor nuance, with a plan view of the footpath zones ----
async function drawCardD(L,hi){const {c,ctx,W,H}=cardCtx();cardKicker(ctx,hi,[CARDS_S[hi?'hi':'en'].kick,L.kick]);
 let y=cardHeadline(ctx,hi,[{t:L.l1},{t:L.l2,box:'ink'},{t:L.l3,box:'yellow'}],140,84);y+=24;
 // plan view, 960×300: building line, walking zone (pavers, walkers), vending and utility zone (cart, tree, pole), kerb, road
 const px=60,pw=960,ph=300;ctx.save();rr(ctx,px,y,pw,ph,18);ctx.clip();
 ctx.fillStyle=SHARE_TOK.plot;ctx.fillRect(px,y,pw,38);
 ctx.fillStyle=SHARE_TOK.paver;ctx.fillRect(px,y+38,pw,120);ctx.strokeStyle=SHARE_TOK.line;ctx.lineWidth=1.5;for(let gx=px;gx<=px+pw;gx+=40){ctx.beginPath();ctx.moveTo(gx,y+38);ctx.lineTo(gx,y+158);ctx.stroke()}for(let gy=y+38;gy<=y+158;gy+=24){ctx.beginPath();ctx.moveTo(px,gy);ctx.lineTo(px+pw,gy);ctx.stroke()}
 ctx.fillStyle=SHARE_TOK.plot2;ctx.fillRect(px,y+158,pw,92);
 for(let x=px;x<px+pw;x+=80){ctx.fillStyle=SHARE_TOK.yellow;ctx.fillRect(x,y+250,40,12);ctx.fillStyle=SHARE_TOK.ink;ctx.fillRect(x+40,y+250,40,12)}
 ctx.fillStyle=SHARE_TOK.asphalt;ctx.fillRect(px,y+262,pw,38);ctx.strokeStyle=SHARE_TOK.chalk;ctx.globalAlpha=.55;ctx.lineWidth=3;ctx.setLineDash([40,30]);ctx.beginPath();ctx.moveTo(px,y+290);ctx.lineTo(px+pw,y+290);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 // walkers in the walking zone
 cardWalker(ctx,px+300,y+130,SHARE_TOK.ink,1.6);cardWalker(ctx,px+360,y+126,SHARE_TOK.ink,1.6);cardWalker(ctx,px+700,y+132,SHARE_TOK.ink,1.6);
 // a cart with an umbrella, a tree and a pole, all in the vending and utility zone
 const cx=px+430,cb=y+244;ctx.fillStyle=SHARE_TOK.ink2;rr(ctx,cx-30,cb-44,60,30,5);ctx.fill();ctx.strokeStyle=SHARE_TOK.ink;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx-15,cb-8,9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(cx+15,cb-8,9,0,Math.PI*2);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cb-44);ctx.lineTo(cx,cb-82);ctx.stroke();ctx.fillStyle=SHARE_TOK.yellow;ctx.beginPath();ctx.arc(cx,cb-72,40,Math.PI,0);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=SHARE_TOK.red;ctx.beginPath();ctx.ellipse(cx,cb-72,14,26,0,Math.PI,0);ctx.fill();
 const tx=px+520;ctx.fillStyle=SHARE_TOK.dirt2;ctx.fillRect(tx-6,cb-40,12,40);ctx.fillStyle=SHARE_TOK.tree;ctx.beginPath();ctx.arc(tx,cb-60,28,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(tx-18,cb-48,16,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(tx+18,cb-50,16,0,Math.PI*2);ctx.fill();
 const lx=px+820;ctx.fillStyle=SHARE_TOK.ink;ctx.fillRect(lx-4,cb-84,8,84);ctx.fillRect(lx,cb-84,22,6);ctx.fillStyle=SHARE_TOK.glow;ctx.beginPath();ctx.arc(lx+24,cb-80,8,0,Math.PI*2);ctx.fill();
 ctx.restore();ctx.lineWidth=4;ctx.strokeStyle=SHARE_TOK.ink;rr(ctx,px,y,pw,ph,18);ctx.stroke();
 const up=t=>hi?t:t.toUpperCase();cardChip(ctx,px+12,y+5,up(L.z1),false,22);cardChip(ctx,px+12,y+46,up(L.z2),true,26);cardChip(ctx,px+12,y+166,up(L.z3),true,26);cardChip(ctx,px+12,y+266,up(L.z4),false,22);
 y+=ph+34;
 y=cardPara(ctx,L.sub,60,y,960,`500 34px ${CARD_BODY}`,SHARE_TOK.ink,46)+18;
 ctx.fillStyle=SHARE_TOK.ink;ctx.font=`600 ${hi?42:40}px ${CARD_HEAD}`;for(const ln of wrapText(ctx,up(L.ask),960)){ctx.fillText(ln,60,y+38);y+=50}
 cardFooter(ctx,W,H,hi,CARDS_S[hi?'hi':'en'].cta);return c}
const CARD_DRAW={a:drawCardA,b:drawCardB,c:drawCardC,d:drawCardD};

// ---- the block on the learn page ----
function cardsL(){return CARDS_S[lang]||CARDS_S.en}
function renderCards(){const box=$('cards');if(!box)return;if(typeof HTMLCanvasElement==='undefined'||!document.createElement('canvas').getContext){$('share-right').hidden=true;return}
 const L=cardsL();if(cardsLang!==lang){cardsLang=lang;
  box.innerHTML=CARD_IDS.map(id=>`<div class="cardw"><div class="sharecard"><img data-card-img="${id}" alt="${esc(L[id].cap)}" hidden><div class="sharewait" data-card-wait="${id}">${esc(T('share_busy'))}</div></div><span class="kicker"><b>${esc(L[id].cap)}</b></span><div class="btnrow"><button type="button" class="btn small yellow" data-card-share="${id}" disabled>${esc(T('share_btn'))}</button><button type="button" class="btn small" data-card-dl="${id}" disabled>${esc(L.dl)}</button></div></div>`).join('');
  for(const id of CARD_IDS){const got=cardCache[lang][id];if(got)showCard(id,got.url)}}
 if(CARD_IDS.every(id=>cardCache[lang][id]))return;
 // draw once the page has settled, so the learn page opens without waiting for four canvases
 if('requestIdleCallback' in window)requestIdleCallback(()=>drawCards(),{timeout:1500});else setTimeout(drawCards,400)}
function showCard(id,url){const im=document.querySelector(`[data-card-img="${id}"]`);if(!im)return;im.src=url;im.hidden=false;const w=document.querySelector(`[data-card-wait="${id}"]`);if(w)w.hidden=true;document.querySelectorAll(`[data-card-share="${id}"],[data-card-dl="${id}"]`).forEach(b=>b.disabled=false)}
async function drawCards(){if(cardsBusy)return;cardsBusy=true;const l=lang,hi=l==='hi',L=CARDS_S[l]||CARDS_S.en;
 try{await cardFontsReady(hi);for(const id of CARD_IDS){if(cardCache[l][id])continue;try{const c=await CARD_DRAW[id](L[id],hi);const blob=await new Promise(res=>c.toBlob(b=>res(b),'image/png'));if(!blob)throw new Error('toBlob');cardCache[l][id]={blob,url:URL.createObjectURL(blob)};if(lang===l)showCard(id,cardCache[l][id].url)}
  catch(e){const w=document.querySelector(`[data-card-wait="${id}"]`);if(w&&lang===l)w.textContent=T('share_err')}}}
 finally{cardsBusy=false}
 if(lang!==l)renderCards()}
function cardFile(id){const got=cardCache[lang][id];if(!got)return null;return new File([got.blob],`right-to-walk-${cardsL()[id].file}.png`,{type:'image/png'})}
async function cardShare(id){const file=cardFile(id);if(!file)return;const text=cardsL()[id].text;
 if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Right to Walk',text});return}catch(e){if(e&&e.name==='AbortError')return}}cardDownload(id)}
function cardDownload(id){const got=cardCache[lang][id];if(!got)return;const a=document.createElement('a');a.href=got.url;a.download=`right-to-walk-${cardsL()[id].file}.png`;document.body.appendChild(a);a.click();a.remove()}
