// ---------- share card: a 1080×1350 picture of one check for WhatsApp, drawn on a canvas ----------
// Uses the street strip (SVG rendered to an image with the daylight palette and the self-hosted fonts embedded) plus canvas text.
const SHARE_S={
 en:{kick:'RIGHT TO WALK · GURUGRAM',l1_fail:'THIS SPOT',l2_fail:'FORCES A STEP ONTO THE ROAD',l1_pass:'THIS SPOT',l2_pass:'IS PASSABLE',l1_prob:'PROBLEMS',l2_prob:'AT ONE SPOT',l1_score:'PROJECT SCORE',found:'Found here:',quote:'“If the road exists, there is a duty to ensure that there are demarcated and well-maintained footpaths for walkers.”',cite:'Supreme Court of India, Maniyar Iliyaz v. P. Ayyappan, 19 June 2026',cta:'Check your street in two minutes',walk:'Right to Walk 100 m continuity check:',yes:'yes',no:'no'},
 hi:{kick:'राइट टू वॉक · गुरुग्राम',l1_fail:'इस जगह',l2_fail:'सड़क पर उतरना पड़ता है',l1_pass:'इस जगह से',l2_pass:'निकला जा सकता है',l1_prob:'समस्याएँ',l2_prob:'एक जगह पर',l1_score:'परियोजना स्कोर',found:'यहाँ मिला:',quote:'“अगर सड़क है, तो चलने वालों के लिए चिह्नित और सँभाले हुए फुटपाथ सुनिश्चित करना एक कर्तव्य है।”',cite:'सुप्रीम कोर्ट, मनियार इलियाज़ बनाम पी. अय्यप्पन, 19 जून 2026',cta:'दो मिनट में अपनी सड़क जाँचें',walk:'राइट टू वॉक की 100 मीटर निरंतरता जाँच:',yes:'हाँ',no:'नहीं'}
};
const SHARE_TOK={paver:'#E6E1D6',line:'#CFC9BC',ink:'#1C1E21',ink2:'#5B5A54',plot:'#F6F3EC',plot2:'#CFC7B8',asphalt:'#2B2E33',chalk:'#FFFFFF',dirt:'#C9B08A',dirt2:'#B39A74',tree:'#6E8B3D',glow:'#FFD24D',water:'#8DB9DA',yellow:'#FFC72C','yellow-ink':'#1C1E21',red:'#DE3A2F',amber:'#EE8B22',green:'#1FAE5A',bg:'#EFEBE3'};
const shareFontCSS={};
async function shareFonts(hi){const key=hi?'hi':'en';if(shareFontCSS[key]!=null)return shareFontCSS[key];const files=[['Khand',600,'khand-600-latin'],['Khand',700,'khand-700-latin']];if(hi)files.push(['Khand',600,'khand-600-devanagari'],['Khand',700,'khand-700-devanagari']);
 const parts=[];for(const [fam,w,f] of files){try{const r=await fetch(`fonts/${f}.woff2`);if(!r.ok)continue;const b=await r.blob();const b64=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)});parts.push(`@font-face{font-family:'${fam}';font-weight:${w};src:url(${b64}) format('woff2')}`)}catch(e){}}
 shareFontCSS[key]=parts.join('');return shareFontCSS[key]}
async function stripImage(svg,hi){const css=await shareFonts(hi);let s=svg.replace(/var\(--s-([a-z0-9-]+)\)/g,(m,k)=>SHARE_TOK[k]||'#000').replace(/var\(--head\)/g,"'Khand',sans-serif").replace(/class="lbl"/g,'class="lbl" style="font-family:Khand,sans-serif;font-weight:600;letter-spacing:.04em;text-transform:uppercase"');
 s=s.replace('<defs>',`<defs><style>${css}</style>`);s=s.replace(/<svg /,'<svg width="1000" height="260" ');
 const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);return new Promise(res=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>res(null);img.src=url})}
function wrapText(ctx,text,maxW){const words=String(text).split(/\s+/);const lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t}if(cur)lines.push(cur);return lines}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function fitFont(ctx,text,maxW,px,min,weight,fam){for(let s=px;s>=min;s-=4){ctx.font=`${weight} ${s}px ${fam}`;if(ctx.measureText(text).width<=maxW)return s}return min}
// state: the live check `st`; returns a Blob (PNG)
async function renderShareCard(stt,lang,opts){opts=opts||{};const L=SHARE_S[lang]||SHARE_S.en;const hi=lang==='hi';const W=1080,H=1350;const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
 const HEAD=`'Khand','Mukta',sans-serif`,BODY=`'Mukta',sans-serif`;
 try{await Promise.all([document.fonts.load(`700 100px Khand`),document.fonts.load(`600 40px Khand`),document.fonts.load(`500 40px Mukta`),document.fonts.load(`400 34px Mukta`)])}catch(e){}
 // paper
 ctx.fillStyle=SHARE_TOK.bg;ctx.fillRect(0,0,W,H);
 // kerb stripe
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,26);ctx.clip();for(let x=-40;x<W+40;x+=52){ctx.fillStyle=SHARE_TOK.yellow;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+26,0);ctx.lineTo(x+26+26,26);ctx.lineTo(x+26,26);ctx.closePath();ctx.fill();ctx.fillStyle=SHARE_TOK.ink;ctx.beginPath();ctx.moveTo(x+26,0);ctx.lineTo(x+52,0);ctx.lineTo(x+78,26);ctx.lineTo(x+52,26);ctx.closePath();ctx.fill()}ctx.restore();
 const q=stt.mode==='quick';const a=stt.answers||{};const gate=q?(stt.quick.spot_passable??stt.quick.gate):a.gate;const obsC=obsCounts(stt.obs||[]);const nObs=(stt.obs||[]).length;
 const d=new Date(stt.meta.date);const dateTxt=d.toLocaleDateString(hi?'hi-IN':'en-IN',{day:'numeric',month:'long',year:'numeric'});
 // kicker
 ctx.fillStyle=SHARE_TOK.ink2;ctx.font=`600 32px ${HEAD}`;if('letterSpacing' in ctx)ctx.letterSpacing='4px';ctx.textBaseline='alphabetic';ctx.fillText(`${L.kick} · ${dateTxt.toUpperCase()}`,60,96);if('letterSpacing' in ctx)ctx.letterSpacing='0px';
 // headline: line 1 plain, line 2 in a box
 let l1,l2,boxBg,boxFg;
 if(!q){const r=scoreOf(a);l1=`${L.l1_score} ${r.s==null?'—':r.s} / 100`;l2=rtwBandText(r.band)||'';if(hi)l2=r.band==='g'?S.hi.band_g:(r.band==='a'?S.hi.band_a:S.hi.band_r);boxBg=r.band==='g'?SHARE_TOK.green:(r.band==='a'?SHARE_TOK.amber:SHARE_TOK.red);boxFg=SHARE_TOK.chalk}
 else if(gate==='no'){l1=L.l1_fail;l2=L.l2_fail;boxBg=SHARE_TOK.red;boxFg=SHARE_TOK.chalk}
 else if(gate==='yes'){l1=L.l1_pass;l2=L.l2_pass;boxBg=SHARE_TOK.green;boxFg=SHARE_TOK.chalk}
 else{l1=hi?`${nObs} ${L.l1_prob}`:`${nObs} ${nObs===1?'PROBLEM':L.l1_prob}`;l2=L.l2_prob;boxBg=SHARE_TOK.yellow;boxFg=SHARE_TOK.ink}
 let y=150;ctx.fillStyle=SHARE_TOK.ink;let s1=fitFont(ctx,l1.toUpperCase(),960,104,56,700,HEAD);ctx.font=`700 ${s1}px ${HEAD}`;ctx.fillText(l1.toUpperCase(),60,y+s1*0.82);y+=s1*0.98+14;
 const t2=l2.toUpperCase();let s2=fitFont(ctx,t2,920,104,48,700,HEAD);ctx.font=`700 ${s2}px ${HEAD}`;const w2=ctx.measureText(t2).width;ctx.fillStyle=boxBg;rr(ctx,60,y,w2+40,s2*1.06,10);ctx.fill();ctx.fillStyle=boxFg;ctx.fillText(t2,80,y+s2*0.84);y+=s2*1.06+28;
 // place line
 const sector=stt.locate.area||stt.meta.sector||'';let place=(stt.locate.road||'').trim();if(!place&&stt.loc.start)place=`${stt.loc.start.lat.toFixed(4)}, ${stt.loc.start.lon.toFixed(4)}`;const placeLine=[place,sector].filter(Boolean).join(' · ')||(hi?'गुरुग्राम':'Gurugram');
 ctx.fillStyle=SHARE_TOK.ink;ctx.font=`500 40px ${BODY}`;const pl=wrapText(ctx,placeLine,960).slice(0,2);for(const ln of pl){ctx.fillText(ln,60,y+38);y+=50}y+=14;
 // the street strip
 const svg=stripSVG(Object.assign({},a,q?{gate:gate||undefined,i1:'yes'}:{}),'found',{id:'sh',obs:stt.obs||[],labels:true,lblScale:1.5});
 const img=await stripImage(svg,hi);const sx=60,sw=960,shh=Math.round(sw*0.26);
 ctx.save();rr(ctx,sx,y,sw,shh,18);ctx.clip();ctx.fillStyle=SHARE_TOK.asphalt;ctx.fillRect(sx,y,sw,shh);if(img)ctx.drawImage(img,sx,y,sw,shh);ctx.restore();ctx.lineWidth=4;ctx.strokeStyle=SHARE_TOK.ink;rr(ctx,sx,y,sw,shh,18);ctx.stroke();y+=shh+30;
 // what was found
 const ents=Object.entries(obsC).sort((x,z)=>z[1]-x[1]);if(ents.length){const txt=L.found+' '+ents.map(([id,n])=>`${(hi?OBS_BY[id].hi:OBS_BY[id].en).toLowerCase()}${n>1?' ×'+n:''}`).join(', ');ctx.fillStyle=SHARE_TOK.ink2;ctx.font=`400 33px ${BODY}`;const lines=wrapText(ctx,txt,960).slice(0,3);for(const ln of lines){ctx.fillText(ln,60,y+30);y+=42}y+=8}
 if(!q&&gate){ctx.fillStyle=gate==='no'?SHARE_TOK.red:SHARE_TOK.green;ctx.font=`600 33px ${HEAD}`;ctx.fillText(`${L.walk} ${gate==='no'?L.no.toUpperCase():L.yes.toUpperCase()}`,60,y+30);y+=52}
 // quote, bottom-anchored above the footer
 const footTop=H-190;ctx.fillStyle=SHARE_TOK.ink;ctx.font=`600 36px ${HEAD}`;const ql=wrapText(ctx,L.quote,940);let qy=footTop-40-ql.length*44-32;if(qy<y+10)qy=y+10;ctx.fillStyle=SHARE_TOK.yellow;ctx.fillRect(60,qy-8,8,ql.length*44+40);ctx.fillStyle=SHARE_TOK.ink;for(const ln of ql){ctx.fillText(ln,90,qy+30);qy+=44}ctx.fillStyle=SHARE_TOK.ink2;ctx.font=`400 26px ${BODY}`;ctx.fillText(L.cite,90,qy+30);
 // footer
 ctx.fillStyle=SHARE_TOK.yellow;ctx.fillRect(0,footTop,W,190);ctx.fillStyle=SHARE_TOK.ink;ctx.font=`600 38px ${HEAD}`;ctx.fillText(L.cta,60,footTop+72);ctx.font=`700 72px ${HEAD}`;ctx.fillText('righttowalk.life',60,footTop+150);
 return new Promise(res=>c.toBlob(b=>res(b),'image/png'))}
