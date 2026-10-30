// ---------- Roads to walk: the assignment sheet for Haryana's own list ----------
const $=id=>document.getElementById(id);
let lang=rtwLS(()=>localStorage.getItem('rtw_lang'))==='hi'?'hi':'en';
const tr=(en,hi)=>lang==='hi'?hi:en;
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-hi]').forEach(el=>{if(!el.dataset.en)el.dataset.en=el.textContent;el.textContent=lang==='hi'?el.dataset.hi:el.dataset.en});$('rd-lang').textContent=lang==='hi'?'English':'हिन्दी'}
function evidenceCell(s){return `<td class="small">${s.fullTested?`${s.fullFailed}/${s.fullTested} ${tr('full checks failed 100 m','पूरी जाँचें 100 मीटर पर असफल')}`:tr('No full 100 m answer','100 मीटर का कोई पूरा जवाब नहीं')}${s.spotReports?` · ${s.spotReports} ${tr('spot reports','एक जगह की जाँचें')}`:''}</td>`}
function roadsTable(res){return `<div class="tbl"><table class="roadtbl"><thead><tr><th>#</th><th>${tr('Road','सड़क')}</th><th>${tr('Agency','एजेंसी')}</th><th>${tr('Type','प्रकार')}</th><th>${tr('Approx. length','लगभग लंबाई')}</th><th>${tr('Planning blocks','योजना के हिस्से')}</th><th>${tr('Nearby checks','पास की जाँचें')}</th><th>${tr('Observed results','दर्ज नतीजे')}</th><th class="blank">${tr('Volunteer 1','स्वयंसेवक 1')}</th><th class="blank">${tr('Volunteer 2','स्वयंसेवक 2')}</th><th class="blank">${tr('Date','तारीख़')}</th></tr></thead><tbody>${res.map((s,i)=>{const r=s.road;return `<tr id="${rtwEsc(r.id)}"><td class="k">${i+1}</td><td class="fg">${rtwEsc(r.name)}${r.note?`<span class="small">${rtwEsc(r.note)}</span>`:''}</td><td>${rtwEsc(rtwRoadAgency(r.agency))}</td><td>${rtwEsc(RTW_ROAD_KIND[r.kind]||r.kind)}</td><td>${rtwEsc(rtwRoadKm(r))}</td><td>${rtwRoadStretches(r)??'—'}</td><td>${s.checks.length}</td>${evidenceCell(s)}<td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>`}).join('')}</tbody></table></div>`}
function sheetTable(res){const rows=[];for(const s of res){const r=s.road;const n=rtwRoadStretches(r)||1;for(let k=1;k<=n;k++)rows.push(`<tr><td class="fg">${rtwEsc(r.name)}</td><td>${k} of ${n}</td><td class="blank wide"></td><td class="blank"></td><td class="blank"></td><td class="blank"></td><td class="blank tick"></td></tr>`)}
 return `<div class="tbl"><table class="roadtbl sheet"><thead><tr><th>Road</th><th>Stretch</th><th class="blank wide">From / to (landmark)</th><th class="blank">Volunteer, left side</th><th class="blank">Volunteer, right side</th><th class="blank">Date</th><th class="blank tick">Both checks in the record</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
async function init(){
 const F=ROADS.frame;$('rd-total').textContent=F.total;$('rd-listed').textContent=F.listed;
 $('rd-sources').innerHTML=F.sources.map(s=>`<li>${rtwEsc(s)}</li>`).join('');$('rd-geo').textContent=F.geometry;
 let rows=[];let live=false;
 if(RTW_ON()){try{rows=(await rtwPublished())||[];live=true}catch(e){}}
 const res=rtwRoadsMatch(rows);const sm=rtwRoadsSummary(res);
 $('rd-walked').textContent=sm.roadsWithNearby;$('rd-fail').textContent=sm.fullFailed;
 $('rd-stretches').textContent=res.reduce((a,s)=>a+(rtwRoadStretches(s.road)||1),0);
 $('rd-live').textContent=live?`${rtwRoadLine(sm)} ${sm.checks} published observations start near listed lines; ${sm.listed} of ${sm.total} roads are named publicly. Read on ${new Date().toLocaleDateString(lang==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'long',year:'numeric'})}.`:(RTW_ON()?tr('Could not load the record right now. The assignment sheet remains usable.','अभी रिकॉर्ड लोड नहीं हुआ। जाँच सूची फिर भी इस्तेमाल कर सकते हैं।'):tr('The record is not connected yet. The assignment sheet remains usable.','रिकॉर्ड अभी जुड़ा नहीं है। जाँच सूची फिर भी इस्तेमाल कर सकते हैं।'));
 $('rd-roads').innerHTML=roadsTable(res);$('rd-sheet').innerHTML=sheetTable(res);
 if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el){el.classList.add('hl');el.scrollIntoView({block:'center'})}}
}
document.addEventListener('click',e=>{if(e.target.id==='rd-print')window.print();if(e.target.id==='rd-lang'){lang=lang==='hi'?'en':'hi';rtwLS(()=>localStorage.setItem('rtw_lang',lang));applyLang();init()}});
applyLang();
init();
