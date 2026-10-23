// ---------- public map ----------
const $=id=>document.getElementById(id);
let ROWS=[],filter='all',layer=null,map=null;
const COLOR={r:'#DE3A2F',a:'#EE8B22',g:'#1FAE5A',n:'#5B5A54'};
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
function draw(){if(!map)return;if(layer)layer.remove();layer=L.layerGroup();const rows=ROWS.filter(keep);
 for(const r of rows){if(r.lat==null)continue;L.circleMarker([r.lat,r.lon],{radius:9,color:'#1C1E21',weight:2,fillColor:pinColor(r),fillOpacity:.92,className:'pin'}).bindPopup(popup(r),{maxWidth:320}).addTo(layer)}
 layer.addTo(map);const with_loc=rows.filter(r=>r.lat!=null);
 const empty=$('m-empty');if(!with_loc.length){empty.hidden=false;$('m-empty-text').textContent=ROWS.length?'No checks match this filter.':'No checks have been published yet. Walk one street and add it to the record.'}else{empty.hidden=true;if(filter==='all'&&with_loc.length>1)map.fitBounds(with_loc.map(r=>[r.lat,r.lon]),{padding:[40,40],maxZoom:16})}}
async function showPhotos(id){const box=$('ph-'+id);if(!box)return;box.innerHTML='<span class="small">Loading…</span>';try{const list=await rtwPhotoList('published/'+id);if(!list||!list.length){box.innerHTML='<span class="small">No photo could be loaded.</span>';return}box.innerHTML='';for(const f of list.slice(0,4)){try{const u=await rtwPhotoURL(`published/${id}/${f.name}`);const im=document.createElement('img');im.src=u;im.alt='';box.appendChild(im)}catch(e){}}}catch(e){box.innerHTML='<span class="small">Could not load the photos.</span>'}}
async function init(){
 map=L.map('map',{scrollWheelZoom:true,zoomControl:true}).setView(RTW.center,RTW.zoom);
 L.tileLayer(RTW.tiles,{attribution:RTW.tilesAttr,maxZoom:19}).addTo(map);
 if(!RTW_ON()){$('m-empty').hidden=false;$('m-empty-text').textContent='The record is not connected yet. Checks still work on the main page; the map fills once Phase 1 is switched on.';return}
 try{const [stats,rows]=await Promise.all([rtwStats(),rtwPublished()]);ROWS=rows||[];$('m-pub').textContent=stats.published;const pct=rtwPct(stats.gate_tested-stats.gate_pass,stats.gate_tested);$('m-fail').textContent=pct==null?'–':pct+'%';draw()}
 catch(e){$('m-empty').hidden=false;$('m-empty-text').textContent='Could not load the record right now. Try again in a minute.'}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.f){filter=b.dataset.f;document.querySelectorAll('#m-filters .chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();return}if(b.dataset.photos){showPhotos(b.dataset.photos)}});
if(window.L)init();else window.addEventListener('load',init);
