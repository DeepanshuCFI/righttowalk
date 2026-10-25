// ---------- the footpath game, second version: a lane game, not a jumping game ----------
// You walk forward on your own along a Gurugram footpath drawn from above. Things on the footpath block it or narrow it,
// exactly as the palette tiles do in real life; the only way past a blocked footpath is the road, where traffic passes.
// The player's one decision is the pedestrian's one decision: step down, step up, or wait. The end card counts what the
// street did to you. Everything is drawn on a canvas with the site's own palette; nothing is loaded from anywhere.
const TOK={paver:'#E6E1D6',line:'#CFC9BC',ink:'#1C1E21',ink2:'#5B5A54',plot:'#F6F3EC',plot2:'#CFC7B8',asphalt:'#2B2E33',chalk:'#FFFFFF',dirt:'#C9B08A',dirt2:'#B39A74',tree:'#6E8B3D',glow:'#FFD24D',water:'#8DB9DA',yellow:'#FFC72C',red:'#DE3A2F',amber:'#EE8B22',green:'#1FAE5A',sign:'#1A7A3C',glass:'#B9C7D2',sky:'#F6F3EC'};
const GS={
 en:{title:'The footpath game',sub:'You walk 500 m of a Gurugram road. The footpath will block you; the only way past is the road, where the traffic is. Step down, step up, or wait for a gap. It is not a game you win. It is a walk you get through.',start:'Start walking',up:'Up to the footpath',down:'Down to the road',wait:'Wait',m:'m',onroad:'on the road',test:'Court’s test, 100 m',still:'The footpath is still blocked here.',near:'Passed within an arm\u2019s length.',
  where:['Near the metro station','A sector main road','Near the chowk'],signs:{metro:'HUDA CITY CENTRE METRO →',sector:'← SECTOR 45 · SECTOR 46 →',chowk:'IFFCO CHOWK 500 m',hoard:'3 BHK · POSSESSION 2027'},
  cap:{electric:'A transformer in the walking zone. The footpath is 0 m wide here.',parked:'A car parked across the footpath. Just for two minutes, since this morning.',vendor:'A vendor cart. You can squeeze past, slowly. The cart has a licence; the footpath has no vending zone.',shop:'The shop has spread to the kerb. Walk on the road, or through the shop.',ramp:'A private ramp poured over the footpath. The house is private. The footpath was not.',manhole:'An open manhole. If you walk into it, this ends.',slab:'Missing slabs. Mind the gap, and the rebar.',dug:'Dug up for a cable. Barricaded with one bamboo pole.',waste:'Malba from a house being renovated. Climb over it, slowly.',furniture:'A bus shelter across the walking zone. People waiting, nowhere to pass.',water:'Waterlogged. You cannot see what is under it.',cattle:'A cow. She is not moving. You are.',riding:'A scooter coming at you along the footpath.',shrine:'A shrine built on the footpath. Nobody will move it.',green:'A tree in the middle of the footpath. It was here first.',pole:'A pole in the walking zone. Half a footpath left.'},
  hit:{car:'A car hugging the kerb hit you.',bus:'A bus pulling into the kerb hit you.',scooter:'A scooter squeezing past on the inside hit you.',auto:'An auto swerving to the kerb for a passenger hit you.',riding:'A scooter riding on the footpath hit you.',manhole:'You stepped into an open manhole.'},
  endh:'You reached 500 m.',deadh:'The walk ended at',stats:{road:'of the walk was on the road',stretches:'times the footpath pushed you onto the road',near:'vehicles passed within an arm’s length',wait:'seconds spent waiting for a gap',gate:'The Court’s test, 100 m without stepping onto the road:',passed:'passed',failed:'failed at',notyet:'not reached'},
  normal:'This is a normal Gurugram road. Every obstacle here is one people tap on real checks.',help:'On a phone: tap the footpath to step up, tap the road to step down, or swipe up and down. Hold Wait to stop. On a keyboard: arrows up and down, space to wait.',note:'Every obstacle is one you can tap on a real check. Nothing here is uploaded or recorded. The backdrops are Gurugram for the feel of it; the obstacles are typical of the city, not a survey of any one spot.',again:'Walk again',real:'Check a real street',share:'Share this walk',shared:'Copied',
  sharetext:(s)=>`I walked ${s.m} m of a Gurugram footpath. ${s.roadPct}% of it was on the road, pushed off ${s.stretches} times, ${s.near} vehicles within an arm’s length. The Supreme Court’s test is 100 m without stepping onto the road. Try it: https://righttowalk.life/game.html`},
 hi:{title:'फुटपाथ का खेल',sub:'आप गुरुग्राम की एक सड़क पर 500 मीटर चलते हैं। फुटपाथ आपको रोकेगा; आगे जाने का एक ही रास्ता है, सड़क, जहाँ ट्रैफ़िक है। नीचे उतरें, ऊपर चढ़ें, या गैप का इंतज़ार करें। यह जीतने का खेल नहीं है। यह एक पैदल सफ़र है जिसे आप पार करते हैं।',start:'चलना शुरू करें',up:'ऊपर फुटपाथ पर',down:'नीचे सड़क पर',wait:'रुकें',m:'मी',onroad:'सड़क पर',test:'कोर्ट की कसौटी, 100 मी',still:'फुटपाथ यहाँ अभी भी बंद है।',near:'एक हाथ की दूरी से निकली।',
  where:['मेट्रो स्टेशन के पास','सेक्टर की मुख्य सड़क','चौक के पास'],signs:{metro:'हुडा सिटी सेंटर मेट्रो →',sector:'← सेक्टर 45 · सेक्टर 46 →',chowk:'इफ़्को चौक 500 मी',hoard:'3 BHK · POSSESSION 2027'},
  cap:{electric:'चलने की जगह में ट्रांसफ़ॉर्मर। यहाँ फुटपाथ 0 मीटर चौड़ा है।',parked:'फुटपाथ पर आड़ी खड़ी गाड़ी। बस दो मिनट के लिए, सुबह से।',vendor:'एक ठेला। धीरे-धीरे निकल सकते हैं। ठेले के पास लाइसेंस है; फुटपाथ पर वेंडिंग ज़ोन नहीं।',shop:'दुकान कर्ब तक फैल गई है। सड़क पर चलें, या दुकान के बीच से।',ramp:'फुटपाथ पर डाला गया निजी रैंप। घर निजी है। फुटपाथ नहीं था।',manhole:'खुला मैनहोल। इसमें पैर पड़ा तो यहीं ख़त्म।',slab:'गायब स्लैब। खाई और सरिये से बचकर।',dug:'केबल के लिए खुदा हुआ। एक बाँस से घेरा हुआ।',waste:'बन रहे घर का मलबा। धीरे-धीरे चढ़कर पार करें।',furniture:'चलने की जगह पर बस शेल्टर। लोग इंतज़ार में, निकलने की जगह नहीं।',water:'जलभराव। नीचे क्या है, दिखता नहीं।',cattle:'एक गाय। वह नहीं हिलेगी। आप हिलेंगे।',riding:'फुटपाथ पर सामने से आता स्कूटर।',shrine:'फुटपाथ पर बना मंदिर। इसे कोई नहीं हटाएगा।',green:'फुटपाथ के बीचोंबीच पेड़। वह पहले से था।',pole:'चलने की जगह में खंभा। आधा फुटपाथ बचा।'},
  hit:{car:'कर्ब से सटकर चलती कार ने आपको टक्कर मारी।',bus:'कर्ब की ओर मुड़ती बस ने आपको टक्कर मारी।',scooter:'अंदर से निकलते स्कूटर ने टक्कर मारी।',auto:'सवारी के लिए कर्ब की ओर मुड़े ऑटो ने टक्कर मारी।',riding:'फुटपाथ पर चलते स्कूटर ने टक्कर मारी।',manhole:'आपका पैर खुले मैनहोल में पड़ा।'},
  endh:'आप 500 मीटर पहुँच गए।',deadh:'सफ़र यहाँ ख़त्म हुआ:',stats:{road:'सफ़र सड़क पर बीता',stretches:'बार फुटपाथ ने आपको सड़क पर धकेला',near:'गाड़ियाँ एक हाथ की दूरी से निकलीं',wait:'सेकंड गैप के इंतज़ार में',gate:'कोर्ट की कसौटी, सड़क पर उतरे बिना 100 मीटर:',passed:'पास',failed:'फ़ेल, यहाँ पर',notyet:'वहाँ तक पहुँचे नहीं'},
  normal:'यह गुरुग्राम की एक आम सड़क है। यहाँ की हर रुकावट वही है जो लोग असली जाँच में दबाते हैं।',help:'फ़ोन पर: ऊपर चढ़ने के लिए फुटपाथ पर टैप करें, नीचे उतरने के लिए सड़क पर, या ऊपर-नीचे स्वाइप करें। रुकने के लिए “रुकें” दबाए रखें। कीबोर्ड पर: ऊपर-नीचे तीर, रुकने के लिए स्पेस।',note:'यहाँ की हर रुकावट वही है जो आप असली जाँच में दबा सकते हैं। यहाँ कुछ अपलोड या दर्ज नहीं होता। पृष्ठभूमि गुरुग्राम की है, एहसास के लिए; रुकावटें शहर की आम रुकावटें हैं, किसी एक जगह का सर्वे नहीं।',again:'फिर चलें',real:'असली सड़क जाँचें',share:'यह सफ़र साझा करें',shared:'कॉपी हो गया',
  sharetext:(s)=>`मैं गुरुग्राम के फुटपाथ पर ${s.m} मीटर चला। ${s.roadPct}% सफ़र सड़क पर बीता, ${s.stretches} बार धकेला गया, ${s.near} गाड़ियाँ एक हाथ की दूरी से निकलीं। सुप्रीम कोर्ट की कसौटी सड़क पर उतरे बिना 100 मीटर है। आज़माएँ: https://righttowalk.life/game.html`}
};
let lang=(()=>{try{return localStorage.getItem('fc_lang')||'en'}catch(e){return 'en'}})();if(!GS[lang])lang='en';
const T=k=>GS[lang][k];const $=id=>document.getElementById(id);const pick=a=>a[Math.floor(Math.random()*a.length)];
// ---- the world: bands from the top of the canvas down. Compound walls, footpath, kerb, near lane (oncoming), far lane (with you) ----
const H=392,PXM=20,TOTAL=500*PXM;let VW=1000;
const Y={wall:108,fp:126,kerb:214,lane1:228,lane2:310};
const WX=180,Y_FP=190,Y_RD=264,STEP_T=0.4;
// obstacle kinds: block = cannot pass on the footpath; narrow/slow = pass at half speed; hole = fatal on the footpath; rider = comes at you along the footpath
const OBST=[['electric','block',64],['parked','block',120],['vendor','narrow',72],['shop','block',96],['ramp','block',88],['manhole','hole',46],['slab','slow',70],['dug','block',110],['waste','narrow',80],['furniture','block',120],['water','slow',120],['cattle','block',86],['riding','rider',60],['shrine','block',70],['green','narrow',64],['pole','narrow',30]];
const KIND=Object.fromEntries(OBST.map(o=>[o[0],{kind:o[1],w:o[2]}]));
const VEH={car:{w:92,h:34,v1:200,v2:60},bus:{w:170,h:40,v1:150,v2:20},scooter:{w:46,h:16,v1:240,v2:110},auto:{w:60,h:30,v1:160,v2:30}};
const STRETCH=[[0,150],[150,300],[300,500]];
const BACKPOOL=[['viaduct','tower','viaduct','hoard','tower','sign:metro','viaduct','tree','tower'],['wall','gate','school','wall','market','tree','gate','sign:sector','wall','park','wall'],['flyover','showroom','dhaba','hospital','hoard','sign:chowk','showroom','tree','pump','showroom']];
const BACKW={viaduct:260,tower:160,hoard:180,sign:120,tree:70,wall:200,gate:90,school:220,market:240,park:260,flyover:420,showroom:200,dhaba:140,hospital:260,pump:200};
let cv,ctx,scale=1,state='idle',last=0,raf=0;
let dist,speed,lane,yPos,stepping,waiting,blocked,obs,cars,backs,nextObs,nextCar1,nextCar2,stats,cap,hit,note,t,hud={};
function reset(){dist=0;speed=0;lane='fp';yPos=Y_FP;stepping=null;waiting=false;blocked=false;obs=[];cars=[];backs=[];nextObs=1250;nextCar1=1.6;nextCar2=0.8;t=0;hit=null;cap=null;note=null;hud={};
 stats={m:0,roadT:0,walkT:0,stretches:0,near:0,waitT:0,gateFail:null};
 obs.push({id:'parked',kind:'block',w:120,x:640,v:0},{id:'vendor',kind:'narrow',w:72,x:1010,v:0});
 cars.push(mkCar(1,dist+VW*0.78,false),mkCar(2,dist+60,false));seedBackdrop()}
// ---- Gurugram backdrops behind the compound wall: half-speed parallax, themed by stretch ----
function seedBackdrop(){let x=0;while(x<TOTAL*0.5+2400){const m=(x*2)/PXM;const th=m<150?0:(m<300?1:2);const kind=pick(BACKPOOL[th]);const w=BACKW[kind.split(':')[0]];backs.push({kind,x,w});x+=w+16+Math.random()*50}}
function drawBack(c){const px=dist*0.5,base=Y.wall;c.fillStyle=TOK.sky;c.fillRect(0,0,VW,base);
 for(const b of backs){const x=b.x-px;if(x+b.w<-20||x>VW+20)continue;const w=b.w,k=b.kind.split(':')[0];
  if(k==='tower'){c.fillStyle=TOK.glass;c.fillRect(x,6,w,base-6);c.fillStyle=TOK.plot2;for(let yy=14;yy<base-6;yy+=14)for(let xx=x+8;xx<x+w-12;xx+=18)c.fillRect(xx,yy,10,8)}
  else if(k==='viaduct'){c.fillStyle=TOK.ink2;c.fillRect(x+30,40,22,base-40);c.fillRect(x+w-52,40,22,base-40);c.fillStyle=TOK.plot2;c.fillRect(x-8,26,w+16,14);c.fillStyle=TOK.ink2;c.fillRect(x-8,38,w+16,3);c.fillStyle=TOK.chalk;c.fillRect(x+10,8,w-20,18);c.fillStyle=TOK.yellow;c.fillRect(x+10,20,w-20,4);c.fillStyle=TOK.glass;for(let xx=x+18;xx<x+w-20;xx+=22)c.fillRect(xx,11,14,7)}
  else if(k==='hoard'){c.fillStyle=TOK.ink2;c.fillRect(x+16,60,6,base-60);c.fillRect(x+w-22,60,6,base-60);c.fillStyle=TOK.chalk;c.fillRect(x,14,w,50);c.strokeStyle=TOK.ink;c.lineWidth=2;c.strokeRect(x,14,w,50);c.fillStyle=TOK.red;c.fillRect(x,14,w,12);c.fillStyle=TOK.ink;c.font='700 13px Khand, sans-serif';c.textAlign='center';c.fillText(T('signs').hoard,x+w/2,48);c.textAlign='left'}
  else if(k==='sign'){c.fillStyle=TOK.ink2;c.fillRect(x+w/2-3,76,6,base-76);c.fillStyle=TOK.sign;c.fillRect(x,40,w,36);c.fillStyle=TOK.chalk;c.font='700 11px Khand, sans-serif';c.textAlign='center';c.fillText(T('signs')[b.kind.split(':')[1]],x+w/2,62,w-8);c.textAlign='left'}
  else if(k==='tree'){c.fillStyle=TOK.dirt2;c.fillRect(x+30,base-34,10,34);c.fillStyle=TOK.tree;c.beginPath();c.arc(x+35,base-46,30,0,7);c.fill()}
  else if(k==='wall'){c.fillStyle=TOK.paver;c.fillRect(x+20,base-104,w-40,70);c.fillStyle=TOK.plot2;c.fillRect(x+40,base-90,24,18);c.fillRect(x+w-64,base-90,24,18);c.fillStyle=TOK.ink2;c.fillRect(x+20,base-108,w-40,4);c.fillStyle=TOK.plot2;c.fillRect(x,base-40,w,40);c.fillStyle=TOK.ink2;c.fillRect(x,base-44,w,4)}
  else if(k==='gate'){c.fillStyle=TOK.plot2;c.fillRect(x,base-40,w,40);c.fillStyle=TOK.ink;c.fillRect(x+14,base-38,w-28,38);c.fillStyle=TOK.plot2;for(let yy=base-34;yy<base-4;yy+=8)c.fillRect(x+18,yy,w-36,2)}
  else if(k==='school'){c.fillStyle=TOK.paver;c.fillRect(x,base-86,w,86);c.fillStyle=TOK.plot2;for(let xx=x+16;xx<x+w-30;xx+=40)c.fillRect(xx,base-46,24,26);c.fillStyle=TOK.yellow;c.fillRect(x+20,base-78,w-40,22);c.fillStyle=TOK.ink;c.font='700 13px Khand, sans-serif';c.textAlign='center';c.fillText('SCHOOL',x+w/2,base-62);c.textAlign='left'}
  else if(k==='market'){for(let xx=x,i=0;xx<x+w-10;xx+=60,i++){c.fillStyle=TOK.paver;c.fillRect(xx,base-60,56,60);c.fillStyle=i%2?TOK.red:TOK.amber;c.fillRect(xx-2,base-62,60,12);c.fillStyle=TOK.ink2;c.fillRect(xx+8,base-44,40,28)}}
  else if(k==='park'){c.fillStyle=TOK.tree;for(let xx=x+30;xx<x+w;xx+=80){c.beginPath();c.arc(xx,base-60,34,0,7);c.fill()}c.fillStyle=TOK.ink2;c.fillRect(x,base-30,w,3);for(let xx=x;xx<x+w;xx+=14)c.fillRect(xx,base-30,2,30)}
  else if(k==='flyover'){c.fillStyle=TOK.asphalt;c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x+w/2,-30,x+w,base);c.lineTo(x+w,base-18);c.quadraticCurveTo(x+w/2,-48,x,base-18);c.closePath();c.fill();c.fillStyle=TOK.ink2;for(let xx=x+70;xx<x+w-40;xx+=90)c.fillRect(xx,34,14,base-34);c.fillStyle=TOK.chalk;c.globalAlpha=.5;c.beginPath();c.moveTo(x+10,base-8);c.quadraticCurveTo(x+w/2,-38,x+w-10,base-8);c.lineWidth=2;c.strokeStyle=TOK.chalk;c.stroke();c.globalAlpha=1}
  else if(k==='showroom'){c.fillStyle=TOK.glass;c.fillRect(x,base-70,w,70);c.fillStyle=TOK.chalk;c.fillRect(x+10,base-58,w-20,40);c.fillStyle=TOK.red;c.fillRect(x+20,base-66,w-40,8);c.fillStyle=TOK.ink2;c.beginPath();c.roundRect(x+30,base-40,w-60,16,8);c.fill()}
  else if(k==='dhaba'){c.fillStyle=TOK.dirt;c.fillRect(x,base-50,w,50);c.fillStyle=TOK.red;c.fillRect(x-6,base-56,w+12,10);c.fillStyle=TOK.ink2;c.fillRect(x+20,base-36,30,36);c.fillStyle=TOK.yellow;c.beginPath();c.arc(x+100,base-30,14,0,7);c.fill()}
  else if(k==='hospital'){c.fillStyle=TOK.chalk;c.fillRect(x,base-100,w,100);c.fillStyle=TOK.plot2;for(let yy=base-88;yy<base-10;yy+=20)for(let xx=x+14;xx<x+w-20;xx+=30)c.fillRect(xx,yy,16,12);c.fillStyle=TOK.red;c.fillRect(x+w/2-18,base-97,36,10);c.fillRect(x+w/2-5,base-110,10,36)}
  else if(k==='pump'){c.fillStyle=TOK.ink2;c.fillRect(x+10,30,8,base-30);c.fillRect(x+w-18,30,8,base-30);c.fillStyle=TOK.chalk;c.fillRect(x-6,18,w+12,14);c.fillStyle=TOK.red;c.fillRect(x-6,18,w+12,5);c.fillStyle=TOK.ink2;c.fillRect(x+50,base-40,22,40);c.fillRect(x+w-72,base-40,22,40);c.fillStyle=TOK.red;c.fillRect(x+54,base-34,14,10);c.fillRect(x+w-68,base-34,14,10)}}
 c.fillStyle=TOK.plot2;c.fillRect(0,Y.wall,VW,Y.fp-Y.wall);c.fillStyle=TOK.ink2;c.fillRect(0,Y.wall,VW,3);c.fillStyle=TOK.line;c.fillRect(0,Y.fp-3,VW,3)}
// ---- obstacles on the footpath, drawn from above; x is world x of the centre ----
function spawnObs(){const m=dist/PXM;const pool=OBST.filter(o=>!(o[0]==='riding'&&m<60));const [id,kind,w]=pick(pool);const o={id,kind,w,x:dist+VW+140,v:0};if(kind==='rider')o.v=-150;obs.push(o);nextObs=dist+380+Math.random()*340}
function drawObs(c,o){const x=o.x-dist,w=o.w,yc=(Y.fp+Y.kerb)/2;const sh=()=>{c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(x,Y.kerb-8,w/2,7,0,0,7);c.fill()};
 switch(o.id){
  case 'electric':sh();c.fillStyle=TOK.ink2;c.fillRect(x-w/2,yc-30,w,60);c.strokeStyle=TOK.ink;c.lineWidth=2;c.strokeRect(x-w/2,yc-30,w,60);c.fillStyle=TOK.yellow;c.beginPath();c.moveTo(x-12,yc+6);c.lineTo(x,yc-14);c.lineTo(x+12,yc+6);c.closePath();c.fill();break;
  case 'parked':sh();c.fillStyle=TOK.ink2;c.beginPath();c.roundRect(x-w/2,yc-26,w,56,12);c.fill();c.fillStyle=TOK.chalk;c.globalAlpha=.75;c.fillRect(x-w/2+22,yc-20,w-44,14);c.fillRect(x-w/2+22,yc+14,w-44,10);c.globalAlpha=1;c.fillStyle=TOK.ink;c.fillRect(x-w/2+6,yc-30,16,8);c.fillRect(x+w/2-22,yc-30,16,8);c.fillRect(x-w/2+6,yc+28,16,8);c.fillRect(x+w/2-22,yc+28,16,8);break;
  case 'vendor':sh();c.fillStyle=TOK.ink2;c.fillRect(x-30,yc-30,60,28);c.fillStyle=TOK.yellow;c.beginPath();c.arc(x,yc-16,34,0,7);c.fill();c.fillStyle=TOK.red;c.beginPath();c.arc(x,yc-16,12,0,7);c.fill();break;
  case 'shop':sh();c.fillStyle=TOK.plot2;c.fillRect(x-w/2,Y.fp,w,54);c.fillStyle=TOK.red;c.fillRect(x-w/2-4,Y.fp,w+8,10);c.fillStyle=TOK.ink2;for(let xx=x-w/2+8;xx<x+w/2-10;xx+=22)c.fillRect(xx,Y.fp+16,16,30);break;
  case 'ramp':c.fillStyle=TOK.plot2;c.beginPath();c.moveTo(x-w/2,Y.fp);c.lineTo(x+w/2,Y.fp);c.lineTo(x+w/2-10,Y.kerb);c.lineTo(x-w/2+10,Y.kerb);c.closePath();c.fill();c.strokeStyle=TOK.ink;c.lineWidth=2;c.stroke();for(let yy=Y.fp+12;yy<Y.kerb;yy+=16){c.beginPath();c.moveTo(x-w/2+6,yy);c.lineTo(x+w/2-6,yy);c.stroke()}break;
  case 'manhole':c.fillStyle=TOK.ink;c.beginPath();c.ellipse(x,yc,w/2,16,0,0,7);c.fill();c.strokeStyle=TOK.ink2;c.lineWidth=3;c.beginPath();c.ellipse(x,yc,w/2+4,20,0,0,7);c.stroke();c.fillStyle=TOK.ink2;c.beginPath();c.ellipse(x+34,yc-12,20,8,-.3,0,7);c.fill();break;
  case 'slab':c.fillStyle=TOK.dirt;c.fillRect(x-w/2,yc-18,w,36);c.fillStyle=TOK.ink;c.fillRect(x-w/2+10,yc-10,24,20);c.fillRect(x+6,yc-14,20,12);c.strokeStyle=TOK.amber;c.lineWidth=3;c.beginPath();c.moveTo(x-w/2+4,yc+8);c.lineTo(x+w/2-6,yc+10);c.stroke();break;
  case 'dug':c.fillStyle=TOK.dirt2;c.fillRect(x-w/2,Y.fp+6,w,Y.kerb-Y.fp-12);c.fillStyle=TOK.ink;c.fillRect(x-w/2+10,Y.fp+20,w-20,30);c.fillStyle=TOK.dirt;c.beginPath();c.ellipse(x+w/2-10,Y.fp+16,24,10,0,0,7);c.fill();c.strokeStyle=TOK.red;c.lineWidth=5;c.setLineDash([12,8]);c.beginPath();c.moveTo(x-w/2,Y.fp+4);c.lineTo(x+w/2,Y.fp+4);c.stroke();c.setLineDash([]);break;
  case 'waste':sh();c.fillStyle=TOK.dirt2;c.beginPath();c.moveTo(x-w/2,yc+26);c.lineTo(x-w/4,yc-14);c.lineTo(x,yc+2);c.lineTo(x+w/4,yc-22);c.lineTo(x+w/2,yc+26);c.closePath();c.fill();c.fillStyle=TOK.red;c.fillRect(x-12,yc,10,7);c.fillRect(x+2,yc-6,10,7);break;
  case 'furniture':sh();c.fillStyle=TOK.ink;c.fillRect(x-w/2,yc-34,w,10);c.fillStyle=TOK.ink2;c.fillRect(x-w/2,yc-24,w,40);c.fillStyle=TOK.chalk;c.globalAlpha=.6;c.fillRect(x-w/2+8,yc-18,w-16,28);c.globalAlpha=1;c.fillStyle=TOK.ink;c.fillRect(x-w/2+4,yc+16,6,16);c.fillRect(x+w/2-10,yc+16,6,16);break;
  case 'water':c.fillStyle=TOK.water;c.beginPath();c.ellipse(x,yc,w/2,34,0,0,7);c.fill();c.strokeStyle=TOK.chalk;c.globalAlpha=.7;c.lineWidth=2;c.beginPath();c.moveTo(x-30,yc-6);c.quadraticCurveTo(x-22,yc-12,x-14,yc-6);c.moveTo(x+4,yc+4);c.quadraticCurveTo(x+12,yc-2,x+20,yc+4);c.stroke();c.globalAlpha=1;break;
  case 'cattle':sh();c.fillStyle=TOK.dirt;c.beginPath();c.ellipse(x,yc,w/2-8,22,0,0,7);c.fill();c.fillStyle=TOK.ink2;c.beginPath();c.ellipse(x+w/2-10,yc-6,14,10,0,0,7);c.fill();c.fillStyle=TOK.ink;c.fillRect(x+w/2-4,yc-18,3,10);c.fillRect(x+w/2-16,yc-18,3,10);break;
  case 'riding':sh();c.fillStyle=TOK.ink;c.fillRect(x-24,yc-6,48,12);c.fillStyle=TOK.ink2;c.beginPath();c.ellipse(x,yc-2,14,10,0,0,7);c.fill();c.fillStyle=TOK.ink;c.beginPath();c.arc(x+2,yc-6,6,0,7);c.fill();c.fillStyle=TOK.yellow;c.fillRect(x-30,yc-3,8,6);break;
  case 'shrine':sh();c.fillStyle=TOK.amber;c.fillRect(x-w/2,yc-24,w,48);c.fillStyle=TOK.yellow;c.beginPath();c.moveTo(x-w/2,yc-24);c.lineTo(x,yc-52);c.lineTo(x+w/2,yc-24);c.closePath();c.fill();c.fillStyle=TOK.red;c.fillRect(x-2,yc-66,4,16);c.fillRect(x+2,yc-66,12,8);break;
  case 'green':c.fillStyle=TOK.dirt2;c.beginPath();c.arc(x,yc,9,0,7);c.fill();c.fillStyle=TOK.tree;c.globalAlpha=.9;c.beginPath();c.arc(x,yc,w/2,0,7);c.fill();c.globalAlpha=1;break;
  case 'pole':c.fillStyle=TOK.ink;c.beginPath();c.arc(x,yc-10,10,0,7);c.fill();c.fillRect(x-26,yc-13,52,5);break}}
// ---- traffic. Lane 1 (next to the kerb) comes towards you, as it does when you walk facing traffic; lane 2 goes your way ----
function mkCar(laneNo,x,hugAllowed){const f=VW/1000;const prev=cars.filter(v=>v.lane===laneNo).sort((a,b)=>laneNo===1?a.x-b.x:b.x-a.x)[0];
 if(laneNo===1){const kind=pick(['car','car','scooter','auto','bus','car','auto']);const d=VEH[kind];const hug=hugAllowed&&Math.random()<(kind==='bus'?0.35:(kind==='scooter'?0.3:0.18));let v=-d.v1*f;
  if(prev&&x-prev.x<900)v=Math.max(v,prev.v);return {kind,w:d.w,h:d.h,lane:1,x,y:Y.lane2-d.h-2,v,hug,near:false}}
 const kind=pick(['car','bus','car','scooter','auto']);const d=VEH[kind];let v=185+Math.random()*40+(kind==='scooter'?20:0)-(kind==='bus'?15:0);
 if(prev&&prev.x-x<900)v=Math.min(v,prev.v);return {kind,w:d.w,h:d.h,lane:2,x,y:Y.lane2+(H-Y.lane2-d.h)/2,v,hug:false,near:false}}
// a lane never spawns onto the tail of the vehicle before it
function laneFree(laneNo,x){return !cars.some(v=>v.lane===laneNo&&Math.abs(v.x-x)<v.w+170)}
function drawCar(c,v){const x=v.x-dist,y=v.y,h=v.h,w=v.w,front=v.lane===1?x:x+w-6;
 c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+w/2,y+h+5,w/2,5,0,0,7);c.fill();
 if(v.kind==='scooter'){c.fillStyle=TOK.ink;c.beginPath();c.roundRect(x,y+3,w,10,5);c.fill();c.fillStyle=TOK.ink2;c.beginPath();c.arc(x+w/2,y+6,8,0,7);c.fill();c.fillStyle=TOK.yellow;c.fillRect(front,y+5,6,6);return}
 if(v.kind==='auto'){c.fillStyle=TOK.yellow;c.beginPath();c.roundRect(x,y,w,h,10);c.fill();c.fillStyle=TOK.green;c.fillRect(x+10,y,w-20,h);c.fillStyle=TOK.ink2;c.globalAlpha=.5;c.fillRect(x+14,y+6,w-28,h-12);c.globalAlpha=1;c.fillStyle=TOK.chalk;c.fillRect(front,y+h/2-3,6,6);return}
 c.fillStyle=v.kind==='bus'?TOK.amber:TOK.chalk;c.beginPath();c.roundRect(x,y,w,h,v.kind==='bus'?6:12);c.fill();c.fillStyle=TOK.ink2;c.globalAlpha=.55;if(v.kind==='bus'){for(let xx=x+10;xx<x+w-16;xx+=22)c.fillRect(xx,y+6,14,10)}else{c.fillRect(x+16,y+5,w-32,9);c.fillRect(x+16,y+h-13,w-32,7)}c.globalAlpha=1;c.fillStyle=TOK.yellow;c.fillRect(front,y+3,6,6);c.fillRect(front,y+h-9,6,6)}
// ---- the walker from above: head, shoulders, swinging arms and legs ----
function drawWalker(c,x,y,color){const col=color||TOK.ink;const ph=(stepping||waiting||blocked||state!=='running')?0:Math.sin(t*11);
 c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x,y+3,18,7,0,0,7);c.fill();
 c.strokeStyle=col;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(x-5,y-10);c.lineTo(x-5+ph*12,y);c.moveTo(x+5,y-10);c.lineTo(x+5-ph*12,y);c.stroke();
 c.fillStyle=col;c.beginPath();c.ellipse(x,y-24,18,12,0,0,7);c.fill();
 c.lineWidth=6;c.beginPath();c.moveTo(x-14,y-22);c.lineTo(x-21+ph*7,y-6);c.moveTo(x+14,y-22);c.lineTo(x+21-ph*7,y-6);c.stroke();
 c.fillStyle=color?TOK.chalk:TOK.dirt;c.strokeStyle=col;c.lineWidth=2.5;c.beginPath();c.arc(x,y-30,9.5,0,7);c.fill();c.stroke()}
function drawFallen(c,x,y){c.save();c.translate(x,y);c.rotate(Math.PI/2);drawWalker(c,0,10,TOK.red);c.restore()}
// ---- rules ----
function walkerBox(){return {x:WX-16,y:yPos-40,w:32,h:40}}
function onRoad(){return lane==='rd'&&!stepping}
const hitR=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function update(dt){t+=dt;
 if(stepping){stepping.t+=dt;const k=Math.min(1,stepping.t/STEP_T);yPos=stepping.from+(stepping.to-stepping.from)*k;if(k>=1){stepping=null;yPos=lane==='fp'?Y_FP:Y_RD}}
 blocked=false;let mult=1,capX=1e9;cap=null;const wb=walkerBox();
 for(const o of obs){const ox=o.x-dist,k=KIND[o.id],left=ox-o.w/2,right=ox+o.w/2;
  if(lane==='fp'&&!stepping){
   if(k.kind==='block'&&right>wb.x&&left<wb.x+wb.w+6)blocked=true;
   if((k.kind==='narrow'||k.kind==='slow')&&right>wb.x&&left<wb.x+wb.w)mult=0.5;
   if(k.kind==='hole'&&ox>wb.x+4&&ox<wb.x+wb.w-4){endWalk('manhole');return}
   if(k.kind==='rider'&&right>wb.x&&left<wb.x+wb.w){endWalk('riding');return}}
  if(right>wb.x&&left<wb.x+340&&ox<capX){capX=ox;cap=o.id}
  if(k.kind==='rider'&&right>wb.x&&left<wb.x+460){capX=-1;cap=o.id}}
 const base=130+Math.min(40,dist/PXM*0.1);speed=(waiting||blocked)?0:base*mult;
 if(waiting)stats.waitT+=dt;
 if(speed>0)dist+=speed*dt;
 if(onRoad())stats.roadT+=dt;stats.walkT+=dt;
 for(const o of obs)if(o.v)o.x+=o.v*dt;obs=obs.filter(o=>o.x-dist>-300);
 if(dist>=nextObs)spawnObs();
 nextCar1-=dt;nextCar2-=dt;if(nextCar1<=0){if(laneFree(1,dist+VW+80)){cars.push(mkCar(1,dist+VW+80,true));nextCar1=1.3+Math.random()*2.0}else nextCar1=0.3}if(nextCar2<=0){if(laneFree(2,dist-200)){cars.push(mkCar(2,dist-200,false));nextCar2=1.2+Math.random()*2.4}else nextCar2=0.3}
 for(const v of cars){v.x+=v.v*dt;if(v.hug&&v.x-dist-WX<520)v.y=Math.max(Y.lane1+12,v.y-60*dt)}
 cars=cars.filter(v=>v.x-dist>-500&&v.x-dist<VW+700);
 for(const v of cars){if(v.lane!==1)continue;const r={x:v.x-dist,y:v.y,w:v.w,h:v.h};
  if(hitR(wb,r)){endWalk(v.kind);return}
  if(onRoad()&&!v.near&&r.x<wb.x+wb.w&&r.x+r.w>wb.x){v.near=true;stats.near++;note={k:'near',until:t+1.0}}}
 if(dist>=TOTAL)endWalk(null)}
function stepDown(){if(state!=='running'||lane!=='fp'||stepping)return;lane='rd';stepping={from:yPos,to:Y_RD,t:0};stats.stretches++;if(stats.gateFail==null&&dist/PXM<100)stats.gateFail=Math.floor(dist/PXM)}
function stepUp(){if(state!=='running'||lane!=='rd'||stepping)return;const wb=walkerBox();
 for(const o of obs){if(KIND[o.id].kind!=='block')continue;const ox=o.x-dist;if(ox+o.w/2>wb.x-10&&ox-o.w/2<wb.x+wb.w+10){note={k:'still',until:t+1.2};return}}
 lane='fp';stepping={from:yPos,to:Y_FP,t:0}}
function endWalk(cause){state='over';hit=cause;cancelAnimationFrame(raf);stats.m=Math.min(500,Math.floor(dist/PXM));drawFrame();drawHUD();showCard()}
function showCard(){const s=stats,st=T('stats'),roadPct=s.walkT?Math.round(s.roadT/s.walkT*100):0,box=$('g-over');box.hidden=false;
 $('g-over-h').textContent=hit==null?T('endh'):`${T('deadh')} ${s.m} ${T('m')}. ${T('hit')[hit]||''}`;
 const gate=s.gateFail!=null?`${esc(st.failed)} ${s.gateFail} ${T('m')}`:(s.m>=100?esc(st.passed):esc(st.notyet));
 $('g-over-p').innerHTML=`<span class="n">${roadPct}%</span> ${esc(st.road)}<br><span class="n">${s.stretches}</span> ${esc(st.stretches)}<br><span class="n">${s.near}</span> ${esc(st.near)}<br><span class="n">${Math.round(s.waitT)}</span> ${esc(st.wait)}<br>${esc(st.gate)} <b>${gate}</b>`;
 $('g-over-best').textContent=T('normal');$('g-share').dataset.text=T('sharetext')({m:s.m,roadPct,stretches:s.stretches,near:s.near});$('g-cap').textContent=hit?T('hit')[hit]:T('endh')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
// ---- drawing ----
function drawFrame(){const c=ctx;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,VW,H);
 drawBack(c);
 c.fillStyle=TOK.paver;c.fillRect(0,Y.fp,VW,Y.kerb-Y.fp);c.strokeStyle=TOK.line;c.lineWidth=1.5;c.beginPath();for(let x=-(dist%48);x<VW+48;x+=48){c.moveTo(x,Y.fp);c.lineTo(x,Y.kerb)}for(let y=Y.fp+22;y<Y.kerb;y+=22){c.moveTo(0,y);c.lineTo(VW,y)}c.stroke();
 for(let x=-(dist%64);x<VW+64;x+=64){c.fillStyle=TOK.yellow;c.fillRect(x,Y.kerb,32,Y.lane1-Y.kerb);c.fillStyle=TOK.ink;c.fillRect(x+32,Y.kerb,32,Y.lane1-Y.kerb)}
 c.fillStyle=TOK.asphalt;c.fillRect(0,Y.lane1,VW,H-Y.lane1);c.fillStyle='rgba(0,0,0,.28)';c.fillRect(0,Y.lane1,VW,7);
 c.strokeStyle=TOK.chalk;c.globalAlpha=.5;c.lineWidth=3;c.setLineDash([36,26]);c.lineDashOffset=dist%62;c.beginPath();c.moveTo(0,Y.lane2);c.lineTo(VW,Y.lane2);c.stroke();c.setLineDash([]);c.globalAlpha=1;
 for(const v of cars)if(v.lane===2)drawCar(c,v);
 for(const o of obs)drawObs(c,o);
 if(state==='over'&&hit)drawFallen(c,WX+6,yPos-10);else drawWalker(c,WX,yPos);
 for(const v of cars)if(v.lane===1)drawCar(c,v);
 if(blocked&&state==='running'&&Math.floor(t*3)%2===0){c.fillStyle=TOK.red;c.beginPath();c.moveTo(WX-10,Y.kerb-4);c.lineTo(WX+10,Y.kerb-4);c.lineTo(WX,Y.kerb+10);c.closePath();c.fill()}}
function drawHUD(){const m=Math.min(500,Math.floor(dist/PXM));const s=STRETCH.findIndex(r=>m>=r[0]&&m<r[1]);const where=T('where')[s<0?2:s];
 const txt=(note&&t<note.until)?T(note.k):(cap?T('cap')[cap]:'');
 if(hud.where!==where){hud.where=where;$('g-where').textContent=where}
 if(hud.m!==m){hud.m=m;$('g-m').textContent=`${m} ${T('m')}`;$('g-bar').style.width=(m/5)+'%'}
 const road=onRoad();if(hud.road!==road){hud.road=road;$('g-road').textContent=road?T('onroad'):'';$('g-dist').classList.toggle('road',road)}
 if(state==='running'&&hud.cap!==txt){hud.cap=txt;$('g-cap').textContent=txt||' '}}
function loop(now){if(state!=='running')return;const dt=Math.min(0.05,(now-last)/1000);last=now;update(dt);if(state==='running'){drawFrame();drawHUD();raf=requestAnimationFrame(loop)}}
function start(){reset();state='running';last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);$('g-over').hidden=true;$('g-start').hidden=true;drawHUD()}
function fit(){const box=$('g-wrap');const w=box.clientWidth;if(!w)return;VW=w<640?720:1000;scale=w/VW;cv.width=Math.round(VW*scale*devicePixelRatio);cv.height=Math.round(H*scale*devicePixelRatio);cv.style.height=Math.round(H*scale)+'px';scale*=devicePixelRatio;if(state!=='running')drawFrame()}
function applyStrings(){$('g-title').textContent=T('title');$('g-sub').textContent=T('sub');$('g-up').textContent=T('up');$('g-down').textContent=T('down');$('g-wait').textContent=T('wait');$('g-again').textContent=T('again');$('g-real').textContent=T('real');$('g-share').textContent=T('share');$('g-start').textContent=T('start');$('g-tick').textContent=T('test');$('g-help').textContent=T('help');$('g-note').textContent=T('note');const b=$('langbtn');if(b)b.textContent=lang==='en'?'हिंदी':'English';document.documentElement.lang=lang==='hi'?'hi':'en';hud={};drawHUD();if(state==='over')showCard();if(state!=='running')drawFrame()}
async function share(){const text=$('g-share').dataset.text||'';try{if(navigator.share){await navigator.share({text});return}}catch(e){if(e&&e.name==='AbortError')return}try{await navigator.clipboard.writeText(text);$('g-share').textContent=T('shared');setTimeout(()=>$('g-share').textContent=T('share'),1500)}catch(e){}}
function init(){cv=$('g-canvas');ctx=cv.getContext('2d');reset();fit();applyStrings();
 window.addEventListener('resize',fit);window.addEventListener('load',fit);setTimeout(fit,60);setTimeout(fit,600);
 // on the strip itself: tap the footpath to step up, the road to step down; a swipe does the same
 let py=null;cv.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='running'){start();return}py=e.clientY});
 cv.addEventListener('pointerup',e=>{if(state!=='running'||py==null)return;const dy=e.clientY-py;py=null;if(dy<-18){stepUp();return}if(dy>18){stepDown();return}const r=cv.getBoundingClientRect();const yy=(e.clientY-r.top)/r.height*H;if(yy<Y.kerb+6)stepUp();else stepDown()});
 $('g-up').addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='running')start();else stepUp()});
 $('g-down').addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='running')start();else stepDown()});
 const wOn=e=>{e.preventDefault();if(state==='running')waiting=true},wOff=()=>{waiting=false};
 $('g-wait').addEventListener('pointerdown',wOn);['pointerup','pointerleave','pointercancel'].forEach(ev=>$('g-wait').addEventListener(ev,wOff));
 document.addEventListener('keydown',e=>{if(e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();if(state!=='running')start();else stepUp()}if(e.code==='ArrowDown'||e.code==='KeyS'){e.preventDefault();if(state!=='running')start();else stepDown()}if(e.code==='Space'){e.preventDefault();if(state!=='running')start();else waiting=true}});
 document.addEventListener('keyup',e=>{if(e.code==='Space')waiting=false});
 $('g-again').addEventListener('click',start);$('g-share').addEventListener('click',share);$('g-start').addEventListener('click',start);
 const lb=$('langbtn');if(lb)lb.addEventListener('click',()=>{lang=lang==='en'?'hi':'en';try{localStorage.setItem('fc_lang',lang)}catch(e){}applyStrings()});
 const nopause=/[?&]nopause/.test(location.search);document.addEventListener('visibilitychange',()=>{if(!nopause&&document.hidden&&state==='running'){state='idle';$('g-start').hidden=false;drawFrame()}})}
init();
