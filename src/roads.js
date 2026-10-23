// ---------- Roads to walk: the assignment sheet for Haryana's own list ----------
const $=id=>document.getElementById(id);
function stateCell(st){const c=st==='fail'?'r':(st==='pass'?'g':'');return `<td class="pctcell ${c}" style="font-size:15px">${rtwEsc(rtwRoadStateText(st))}</td>`}
function roadsTable(res){return `<div class="tbl"><table class="roadtbl"><thead><tr><th>#</th><th>Road</th><th>Agency</th><th>Type</th><th>Length</th><th>500 m stretches</th><th>Checks</th><th>Status</th><th class="blank">Volunteer 1</th><th class="blank">Volunteer 2</th><th class="blank">Walked on</th></tr></thead><tbody>${res.map((s,i)=>{const r=s.road;return `<tr id="${rtwEsc(r.id)}"><td class="k">${i+1}</td><td class="fg">${rtwEsc(r.name)}${r.note?`<span class="small">${rtwEsc(r.note)}</span>`:''}</td><td>${rtwEsc(rtwRoadAgency(r.agency))}</td><td>${rtwEsc(RTW_ROAD_KIND[r.kind]||r.kind)}</td><td>${rtwEsc(rtwRoadKm(r))}</td><td>${rtwRoadStretches(r)??'—'}</td><td>${s.checks.length}</td>${stateCell(s.state)}<td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>`}).join('')}</tbody></table></div>`}
function sheetTable(res){const rows=[];for(const s of res){const r=s.road;const n=rtwRoadStretches(r)||1;for(let k=1;k<=n;k++)rows.push(`<tr><td class="fg">${rtwEsc(r.name)}</td><td>${k} of ${n}</td><td class="blank wide"></td><td class="blank"></td><td class="blank"></td><td class="blank"></td><td class="blank tick"></td></tr>`)}
 return `<div class="tbl"><table class="roadtbl sheet"><thead><tr><th>Road</th><th>Stretch</th><th class="blank wide">From / to (landmark)</th><th class="blank">Volunteer, left side</th><th class="blank">Volunteer, right side</th><th class="blank">Date</th><th class="blank tick">Both checks in the record</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
async function init(){
 const F=ROADS.frame;$('rd-total').textContent=F.total;$('rd-listed').textContent=F.listed;
 $('rd-sources').innerHTML=F.sources.map(s=>`<li>${rtwEsc(s)}</li>`).join('');$('rd-geo').textContent=F.geometry;
 let rows=[];let live=false;
 if(RTW_ON()){try{rows=(await rtwPublished())||[];live=true}catch(e){}}
 const res=rtwRoadsMatch(rows);const sm=rtwRoadsSummary(res);
 $('rd-walked').textContent=sm.walked;$('rd-fail').textContent=sm.fail;
 $('rd-stretches').textContent=res.reduce((a,s)=>a+(rtwRoadStretches(s.road)||1),0);
 $('rd-live').textContent=live?`${rtwRoadLine(sm)} ${sm.listed} of the ${sm.total} are public so far (${sm.checks} published ${sm.checks===1?'check falls':'checks fall'} on them). Read on ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}.`:(RTW_ON()?'Could not load the record right now; the sheet still works, the status column is blank.':'The record is not connected; the sheet still works, the status column is blank.');
 $('rd-roads').innerHTML=roadsTable(res);$('rd-sheet').innerHTML=sheetTable(res);
 if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el){el.classList.add('hl');el.scrollIntoView({block:'center'})}}
}
document.addEventListener('click',e=>{if(e.target.id==='rd-print')window.print()});
init();
