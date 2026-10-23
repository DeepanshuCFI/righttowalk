// ---------- public map ----------
const $=id=>document.getElementById(id);
let ROWS=[],filter='all',layer=null,map=null,roadsOn=true,roadsLayer=null,deathsOn=true,deathsLayer=null;
const COLOR={r:'#DE3A2F',a:'#EE8B22',g:'#1FAE5A',n:'#5B5A54'};
const RCOL={none:'#5B5A54',walked:'#5B5A54',pass:'#1FAE5A',fail:'#DE3A2F'};
function pinColor(r){if(r.gate==='no')return COLOR.r;if(r.band)return COLOR[r.band]||COLOR.n;if(r.gate==='yes')return COLOR.g;return COLOR.n}
function keep(r){if(filter==='fail')return r.gate==='no';if(filter==='pass')return r.gate==='yes';if(filter==='full')return r.mode==='full';if(filter==='verified')return !!r.verified;return true}
function popup(r){const q=r.mode==='quick';const ents=rtwObsEntries(r.obs);
 let h=`<div class="pop" data-id="${rtwEsc(r.id)}"><b>${rtwEsc(rtwPlace(r))}</b>${r.sector?` · ${rtwEsc(r.sector)}`:''}<div class="small">${rtwDate(r.created_at)} · ${q?'Quick check':'Full stretch'}${r.length_m?` · about ${r.length_m} m`:''}${r.side?` · ${r.side}-hand side`:''}${r.verified?' · <b style="font-size:13px">Verified</b>':''}</div>`;
 if(r.gate)h+=`<div><span class="gatechip ${r.gate==='yes'?'ok':'bad'}">${r.gate==='yes'?'Passes the 100 m test':'Fails the 100 m test'}</span></div>`;
 if(!q&&r.score!=null)h+=`<div class="small" style="margin-top:6px"><b style="font-size:20px;color:${COLOR[r.band]||'inherit'}">${r.score}</b> / 100 · ${rtwEsc(rtwBandText(r.band))}</div>`;
 if(ents.length)h+=`<div class="obsrow">${ents.map(([id,n])=>`<div class="obchip">${obsIcon(id,'obicon sm')}<span>${rtwEsc(OBS_BY[id].en)}${n>1?' ×'+n:''}</span></div>`).join('')}</div>`;
 if(r.owner&&r.owner!=='unknown')h+=`<div class="small" style="margin-top:6px">Road owner, as reported: ${rtwEsc(RTW_OWNER_SHORT[r.owner]||r.owner)}</div>`;
 if(r.photo_count)h+=`<div id="ph-${rtwEsc(r.id)}"><button type="button" class="btn small" data-photos="${rtwEsc(r.id)}">Show ${r.photo_count===1?'the photo':r.photo_count+' photos'}</button></div>`;
 h+=`<div class="small" style="margin-top:8px"><a href="${rtwOSM(r)}" target="_blank" rel="noopener">Open in OpenStreetMap</a> · ref ${rtwShort(r.id)}</div></div>`;return h}
// the roads on Haryana's own list, coloured by what the record says about them
function roadPopup(s){const r=s.road;const n=s.checks.length;
 return `<div class="pop"><b>${rtwEsc(r.name)}</b><div class="small">On Haryana's 30-day list · ${rtwEsc(rtwRoadAgency(r.agency))} · ${rtwEsc(RTW_ROAD_KIND[r.kind]||r.kind)} · ${rtwEsc(rtwRoadKm(r))}</div><div><span class="gatechip ${s.state==='fail'?'bad':(s.state==='pass'?'ok':'')}">${rtwEsc(rtwRoadStateText(s.state))}</span></div><div class="small" style="margin-top:6px">${n?`${n} published ${n===1?'check':'checks'} on this road${s.tested?` · ${s.fail} of ${s.tested} tested ${s.tested===1?'fails':'fail'}`:''}`:'No published check on this road yet. Walk it and add the check to the record.'}</div><div class="small" style="margin-top:8px"><a href="roads.html#${rtwEsc(r.id)}">Assignment sheet</a> · <a href="index.html#check">Check this road</a></div></div>`}
function drawRoads(){if(!map)return;if(roadsLayer){roadsLayer.remove();roadsLayer=null}if(!roadsOn)return;roadsLayer=L.layerGroup();
 for(const s of rtwRoadsMatch(ROWS)){const r=s.road;if(!r.pts||r.pts.length<2)continue;const st=s.state;
  L.polyline(r.pts,{color:RCOL[st],weight:st==='none'?4:6,opacity:st==='none'?.8:.95,dashArray:st==='none'?'1 10':null,lineCap:'round',lineJoin:'round',className:'road road-'+st}).bindPopup(roadPopup(s),{maxWidth:320}).addTo(roadsLayer)}
 roadsLayer.addTo(map);if(layer)layer.eachLayer(l=>l.bringToFront&&l.bringToFront())}
// deaths on record: one mark per case, the record's own words in the popup, and a link that pre-fills a check at that spot
function deathPopup(x){const c=x.c;const n=x.checks.length;
 return `<div class="pop death"><b>${rtwEsc(c.place||'Place not on record')}</b>${c.sector?` · ${rtwEsc(c.sector)}`:''}<div class="small">${rtwEsc(rtwDeathDate(c))}${c.acc&&c.acc!=='exact'?` · place ${rtwEsc(c.acc)}`:''}</div><p style="margin:8px 0 4px">${rtwEsc(rtwDeathLine(c))}.</p><p class="small"><b>What the road lacked, as recorded:</b> “${rtwEsc(c.fact)}” ${rtwDeathSource(c)}</p>${c.factors?`<p class="small">Also reported: ${rtwEsc(c.factors)}.</p>`:''}${c.record?`<p class="small">On record: ${c.record_url?`<a href="${rtwEsc(c.record_url)}" target="_blank" rel="noopener">${rtwEsc(c.record)}</a>`:rtwEsc(c.record)}${c.status==='live case'?' (before a court or tribunal)':''}</p>`:''}<div class="small" style="margin-top:6px">${n?`${n} published ${n===1?'check':'checks'} within 60 m${x.fail?`; ${x.fail} ${x.fail===1?'fails':'fail'} the 100 m test`:''}.`:'This stretch has not been checked since.'}</div><div style="margin-top:8px"><a class="btn small" href="${rtwDeathWalkURL(c)}">Walk this stretch</a></div></div>`}
let deathMarkers={};
function drawDeaths(){if(!map)return;if(deathsLayer){deathsLayer.remove();deathsLayer=null}deathMarkers={};if(!deathsOn)return;deathsLayer=L.layerGroup();
 for(const x of rtwDeathsMatch(ROWS)){const c=x.c;if(!rtwDeathPlaced(c))continue;const mk=L.circleMarker([+c.lat,+c.lon],{radius:7,color:'#F3EFE6',weight:2.5,fillColor:'#1C1E21',fillOpacity:1,className:'death'}).bindPopup(deathPopup(x),{maxWidth:320}).addTo(deathsLayer);deathMarkers[c.id]=mk}
 deathsLayer.addTo(map)}
function openDeep(){const m=(location.hash||'').match(/^#d=([\w-]+)$/);if(!m)return;const mk=deathMarkers[m[1]];if(!mk)return;map.setView(mk.getLatLng(),17);setTimeout(()=>mk.openPopup(),250)}
function roadsBounds(){const pts=[];for(const r of ROADS.roads)if(r.pts)pts.push(...r.pts);return pts}
function draw(){if(!map)return;if(layer)layer.remove();layer=L.layerGroup();const rows=ROWS.filter(keep);
 for(const r of rows){if(r.lat==null)continue;L.circleMarker([r.lat,r.lon],{radius:9,color:'#1C1E21',weight:2,fillColor:pinColor(r),fillOpacity:.92,className:'pin'}).bindPopup(popup(r),{maxWidth:320}).addTo(layer)}
 layer.addTo(map);drawRoads();drawDeaths();const with_loc=rows.filter(r=>r.lat!=null);
 const empty=$('m-empty');
 if(!with_loc.length){if(ROWS.length||!roadsOn){empty.hidden=false;$('m-empty-text').textContent=ROWS.length?'No checks match this filter.':'No checks have been published yet. Walk one street and add it to the record.'}else empty.hidden=true;if(roadsOn&&filter==='all')map.fitBounds(roadsBounds(),{padding:[30,30],maxZoom:14})}
 else{empty.hidden=true;if(filter==='all'&&with_loc.length>1)map.fitBounds(with_loc.map(r=>[r.lat,r.lon]),{padding:[40,40],maxZoom:16})}}
async function showPhotos(id){const box=$('ph-'+id);if(!box)return;box.innerHTML='<span class="small">Loading…</span>';try{const list=await rtwPhotoList('published/'+id);if(!list||!list.length){box.innerHTML='<span class="small">No photo could be loaded.</span>';return}box.innerHTML='';for(const f of list.slice(0,4)){try{const u=await rtwPhotoURL(`published/${id}/${f.name}`);const im=document.createElement('img');im.src=u;im.alt='';box.appendChild(im)}catch(e){}}}catch(e){box.innerHTML='<span class="small">Could not load the photos.</span>'}}
async function init(){
 $('m-deaths').textContent=String(rtwDeathsSummary(rtwDeathsMatch([])).total);
 map=L.map('map',{scrollWheelZoom:true,zoomControl:true}).setView(RTW.center,RTW.zoom);
 L.tileLayer(RTW.tiles,{attribution:RTW.tilesAttr,maxZoom:19}).addTo(map);
 if(!RTW_ON()){draw();openDeep();$('m-empty').hidden=false;$('m-empty-text').textContent='The record is not connected yet. The dashed lines are the roads on Haryana\'s own list; checks still work on the main page.';return}
 try{const [stats,rows]=await Promise.all([rtwStats(),rtwPublished()]);ROWS=rows||[];$('m-pub').textContent=stats.published;const pct=rtwPct(stats.gate_tested-stats.gate_pass,stats.gate_tested);$('m-fail').textContent=pct==null?'–':pct+'%';draw();openDeep()}
 catch(e){draw();$('m-empty').hidden=false;$('m-empty-text').textContent='Could not load the record right now. Try again in a minute.'}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.f){filter=b.dataset.f;document.querySelectorAll('#m-filters .chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();return}
 if(b.dataset.layer==='roads'){roadsOn=!roadsOn;b.setAttribute('aria-pressed',String(roadsOn));draw();return}
 if(b.dataset.layer==='deaths'){deathsOn=!deathsOn;b.setAttribute('aria-pressed',String(deathsOn));draw();return}
 if(b.dataset.photos){showPhotos(b.dataset.photos)}});
if(window.L)init();else window.addEventListener('load',init);
