// ---------- Gurugram report, rendered live from the public views ----------
const $=id=>document.getElementById(id);
function pctCell(a,b){const p=rtwPct(a,b);return p==null?'<td class="pctcell">—</td>':`<td class="pctcell ${p>=50?'r':(p===0?'g':'')}">${p}%</td>`}
function table(head,rows){return `<div class="tbl"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
function empty(msg){return `<div class="empty">${rtwEsc(msg)}</div>`}
async function init(){
 const now=new Date();$('r-cite-date').textContent=now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
 if(!RTW_ON()){$('r-when').textContent='not connected';$('r-lead').textContent='The record is not connected yet. This page fills from the public dataset once Phase 1 is switched on.';['r-sectors','r-owners','r-obs','r-worst'].forEach(id=>$(id).innerHTML=empty('No data yet.'));const r0=rtwRoadsMatch([]);$('r-roads-line').firstChild.textContent=rtwRoadLine(rtwRoadsSummary(r0));$('r-roads').innerHTML=table(['Road','Agency','Type','Checks','Result'],r0.map(s=>`<tr><td class="fg">${rtwEsc(s.road.name)}</td><td>${rtwEsc(rtwRoadAgency(s.road.agency))}</td><td>${rtwEsc(RTW_ROAD_KIND[s.road.kind]||s.road.kind)}</td><td>0</td><td>${rtwEsc(rtwRoadStateText('none'))}</td></tr>`));return}
 let stats,sectors,owners,rows;
 try{[stats,sectors,owners,rows]=await Promise.all([rtwStats(),rtwSectorStats(),rtwOwnerStats(),rtwPublished()])}catch(e){$('r-lead').textContent='Could not load the record right now. Try again in a minute.';return}
 rows=rows||[];sectors=sectors||[];owners=owners||[];
 $('r-when').textContent=now.toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
 const failed=stats.gate_tested-stats.gate_pass;const pct=rtwPct(failed,stats.gate_tested);
 $('r-pct').textContent=pct==null?'—':pct+'%';
 if(pct==null){$('r-pct').textContent='—';$('r-pct-l').textContent='No stretch on the record has answered the 100 m test yet. The number appears with the first published check.'}
 $('r-lead').textContent=stats.published?`${stats.published} footpath ${stats.published===1?'check':'checks'} from ${stats.people||'—'} ${stats.people===1?'person':'people'} are on the public record${stats.first?`, the first on ${rtwDate(stats.first)}`:''}. Of the ${stats.gate_tested} that answered the Court's 100 m test, ${failed} failed it.`:'Nothing is on the public record yet. Be the first: check a street on the main page and add it to the record.';
 $('r-tiles').innerHTML=[[stats.published,'checks on the public record'],[stats.submitted-stats.published,'sent in, waiting for a moderator'],[stats.people||0,'people who walked'],[rtwPct(stats.with_footpath,stats.full)==null?'—':rtwPct(stats.with_footpath,stats.full)+'%','of full stretches have a footpath at all'],[stats.full,'full 500 m stretches'],[rtwPct(stats.verified,stats.published)==null?'—':rtwPct(stats.verified,stats.published)+'%','of the record re-walked and verified']].map(([n,l])=>`<div class="stattile"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');
 // Haryana's own list: the sampling frame under the self-selected pins
 const rres=rtwRoadsMatch(rows),rsm=rtwRoadsSummary(rres);
 $('r-roads-line').firstChild.textContent=rtwRoadLine(rsm);$('r-roads-note').textContent=`${rsm.listed} of the ${rsm.total} are public so far; ${rsm.checks} published ${rsm.checks===1?'check falls':'checks fall'} on them.`;
 $('r-roads').innerHTML=table(['Road','Agency','Type','Checks','Result'],rtwRoadsSorted(rres).map(s=>`<tr><td class="fg"><a href="roads.html#${rtwEsc(s.road.id)}">${rtwEsc(s.road.name)}</a></td><td>${rtwEsc(rtwRoadAgency(s.road.agency))}</td><td>${rtwEsc(RTW_ROAD_KIND[s.road.kind]||s.road.kind)}</td><td>${s.checks.length}</td><td class="pctcell ${s.state==='fail'?'r':(s.state==='pass'?'g':'')}" style="font-size:15px">${rtwEsc(rtwRoadStateText(s.state))}</td></tr>`));
 // by sector
 $('r-sectors').innerHTML=sectors.length?table(['Sector or area','Checks','Tested','Fail 100 m','Share failing','Full checks with a footpath'],sectors.map(s=>`<tr><td class="fg">${rtwEsc(s.sector)}</td><td>${s.checks}</td><td>${s.gate_tested}</td><td>${s.gate_tested-s.gate_pass}</td>${pctCell(s.gate_tested-s.gate_pass,s.gate_tested)}<td>${rtwPct(s.with_footpath,s.full_checks)==null?'—':rtwPct(s.with_footpath,s.full_checks)+'%'}</td></tr>`)):empty('No published checks yet.');
 // by owner
 $('r-owners').innerHTML=owners.length?table(['Reported owner','Checks','Tested','Fail 100 m','Share failing'],owners.map(o=>`<tr><td class="fg">${rtwEsc(RTW_OWNER_SHORT[o.owner]||o.owner)}</td><td>${o.checks}</td><td>${o.gate_tested}</td><td>${o.gate_tested-o.gate_pass}</td>${pctCell(o.gate_tested-o.gate_pass,o.gate_tested)}</tr>`)):empty('No published checks yet.');
 // obstacles
 const tot={};for(const r of rows)for(const [id,n] of rtwObsEntries(r.obs))tot[id]=(tot[id]||0)+n;const ents=Object.entries(tot).sort((a,b)=>b[1]-a[1]);const mx=ents.length?ents[0][1]:1;
 $('r-obs').innerHTML=ents.length?`<div class="bars">${ents.map(([id,n])=>`<div class="bar"><span class="t">${rtwEsc(OBS_BY[id].en)}</span><span class="b"><i class="${OBS_BY[id].sev==='off'||OBS_BY[id].sev==='fall'?'r':''}" style="width:${Math.max(2,Math.round(n/mx*100))}%"></i></span><span class="n">${n}</span></div>`).join('')}</div><p class="small" style="margin-top:8px">Red bars are problems that force a walker onto the road or can injure; grey ones narrow the path.</p>`:empty('Nothing tapped on a published check yet.');
 // worst ten
 const worst=rows.filter(r=>r.mode==='full'&&r.score!=null).sort((a,b)=>(a.score-b.score)||(a.gate==='no'?-1:1)).slice(0,10);
 $('r-worst').innerHTML=worst.length?`<div class="worst">${worst.map((r,i)=>`<div class="row"><span class="k">${i+1}</span><span class="t">${rtwEsc(rtwPlace(r))}${r.sector?`, ${rtwEsc(r.sector)}`:''}<span class="small">${rtwDate(r.created_at)}${r.side?` · ${r.side}-hand side`:''}${r.length_m?` · about ${r.length_m} m`:''}${r.owner&&r.owner!=='unknown'?` · ${rtwEsc(RTW_OWNER_SHORT[r.owner])}`:''} · <a href="${rtwOSM(r)}" target="_blank" rel="noopener">map</a></span></span><span class="scorepill ${r.band||''}">${r.score}${r.gate==='no'?' · fails 100 m':''}</span></div>`).join('')}</div>`:empty('No full stretch has been published yet. Quick checks make pins; full checks make this list.');
}
document.addEventListener('click',e=>{if(e.target.id==='r-print')window.print()});
init();
