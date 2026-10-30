// ---------- moderation: Supabase Auth magic link (implicit flow), PostgREST reads and updates as the signed-in moderator ----------
const $=id=>document.getElementById(id);
const SKEY='rtw_mod_session';
let session=null,tab='pending',rows=[],counts={},busy=false,isMod=null,lastErr='';
const esc=rtwEsc;
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200)}
function emailOf(jwt){try{const b=jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const pad=b+'==='.slice((b.length+3)%4);return JSON.parse(decodeURIComponent(escape(atob(pad)))).email||''}catch(e){return ''}}
function loadSession(){session=rtwLS(()=>JSON.parse(sessionStorage.getItem(SKEY)||'null'))}
function saveSession(){rtwLS(()=>session?sessionStorage.setItem(SKEY,JSON.stringify(session)):sessionStorage.removeItem(SKEY))}
function parseHash(){const h=location.hash.slice(1);if(!h.includes('access_token='))return false;const p=new URLSearchParams(h);const at=p.get('access_token');if(!at)return false;
 session={access_token:at,refresh_token:p.get('refresh_token')||'',expires_at:Date.now()+(+p.get('expires_in')||3600)*1000,email:emailOf(at)};saveSession();history.replaceState(null,'',location.pathname);return true}
async function refresh(){if(!session||!session.refresh_token)return false;try{const j=await rtwJSON('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});session={access_token:j.access_token,refresh_token:j.refresh_token||session.refresh_token,expires_at:Date.now()+((j.expires_in||3600)*1000),email:emailOf(j.access_token)||session.email};saveSession();return true}catch(e){session=null;saveSession();return false}}
async function tok(){if(!session)return null;if(Date.now()>session.expires_at-60000){if(!(await refresh()))return null}return session.access_token}
async function sendLink(email){await rtwJSON('/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,create_user:true})})}
async function signOut(){const t=await tok();if(t){try{await rtwFetch('/auth/v1/logout',{method:'POST'},t)}catch(e){}}session=null;isMod=null;rows=[];counts={};saveSession();render()}
async function load(){const t=await tok();if(!t){render();return}busy=true;lastErr='';render();
 try{if(isMod==null)isMod=await rtwJSON('/rest/v1/rpc/is_moderator',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'},t);
  const all=await rtwRows('/rest/v1/checks?select=id,status',t);counts={};for(const r of all)counts[r.status]=(counts[r.status]||0)+1;
  rows=await rtwRows(`/rest/v1/checks?status=eq.${tab}&select=*&order=created_at.desc`,t)}
 catch(e){lastErr=e.message||'error';if(e.status===401){session=null;saveSession()}}
 busy=false;render()}
function ansHTML(r){const a=r.answers||{};return ITEMS.filter(it=>!it.gate&&!it.anchor).map(it=>{let v=a[it.id];if(a.i1==='no'&&it.nf)v='no';return v?`<span class="${esc(v)}">${esc(it.lbl_en)}: ${esc(v)}</span>`:''}).join('')}
function actions(r){const s=r.status;const b=(act,label,cls)=>`<button type="button" class="btn small ${cls||''}" data-act="${act}" data-id="${esc(r.id)}">${label}</button>`;
 if(s==='pending')return b('publish','Publish','ok')+b('reject','Reject','danger')+b('test','Mark test');
 if(s==='published')return (r.verified?b('unverify','Remove verification'):b('verify','Link re-walk','ok'))+b('unpublish','Unpublish');
 return b('restore','Back to pending')+b('delete','Delete for good','danger')}
function rowHTML(r){const q=r.mode==='quick';const ents=rtwObsEntries(r.obs);const ans=q?'':ansHTML(r);
 return `<div class="modrow" data-id="${esc(r.id)}"><div class="head"><b>${esc(rtwPlace(r))}${r.sector?' · '+esc(r.sector):''}</b><span class="st ${esc(r.status)}">${esc(r.status)}${r.verified?' · linked re-walk':''}${r.legacy_verified?' · earlier unlinked mark':''}</span></div>
 <div class="meta">${rtwDate(r.created_at)} · ${q?'Quick spot check':'Full check'} · ${r.side?r.side+'-hand side':'side not given'} · ${r.lat!=null?`<a href="${rtwOSM(r)}" target="_blank" rel="noopener">${r.lat}, ${r.lon}</a>${r.acc_m?` (±${r.acc_m} m)`:''}`:'no location'}${r.length_m!=null?` · start/end straight line ${r.length_m} m`:' · length not measured'} · owner ${esc(RTW_OWNER_SHORT[r.owner]||'?')}${r.land?` · ${esc(r.land)}`:''}${r.road_class?` · ${esc(r.road_class)}`:''} · ${esc(r.lang||'')}${r.first_name?` · by ${esc(r.first_name)}`:''}${r.ped_count!=null?` · ${r.ped_count} walkers / 5 min`:''} · ID <code>${esc(r.id)}</code></div>
 ${r.gate||r.spot_passable||(!q&&r.score!=null)?`<div>${q&&r.spot_passable?`<span class="gatechip ${r.spot_passable==='yes'?'ok':'bad'}">${r.spot_passable==='yes'?'Can pass this spot':'Must step into road at this spot'}</span> `:''}${!q&&r.gate?`<span class="gatechip ${r.gate==='yes'?'ok':'bad'}">${r.gate==='yes'?'Passes project 100 m check':'Fails project 100 m check'}</span> `:''}${!q&&r.score!=null?`<span class="scorepill ${esc(r.band||'')}">${r.score} · ${esc(rtwBandText(r.band))}</span>`:''}</div>`:''}
 ${ans?`<div class="ans">${ans}</div>`:''}
 ${ents.length?`<div class="obsrow">${ents.map(([id,n])=>`<div class="obchip">${obsIcon(id,'obicon sm')}<span>${esc(OBS_BY[id].en)}${n>1?' ×'+n:''}</span></div>`).join('')}</div>`:''}
 ${r.anchor!=null&&S.en.anchors[r.anchor]?`<div class="small">Would let a child or grandparent walk alone: ${esc(S.en.anchors[r.anchor])}</div>`:''}
 <div class="ph" data-ph="${esc(r.id)}" data-folder="${r.status==='published'?'published':'pending'}"><span class="small">Loading photos…</span></div>
 ${r.mod_note||r.moderated_by?`<div class="small">${r.mod_note?`Note: ${esc(r.mod_note)} · `:''}${esc(r.moderated_by||'')} ${r.moderated_at?rtwDate(r.moderated_at):''}</div>`:''}
 ${r.verified?`<div class="small">Linked re-walk: <code>${esc(r.verification_check_id||'')}</code> · ${rtwDate(r.verified_at)}</div>`:''}
 <div class="act"><input type="text" placeholder="note (optional, never published)" data-note="${esc(r.id)}" maxlength="500">${r.status==='published'&&!r.verified?`<input type="text" aria-label="Later published re-walk check UUID" placeholder="Later published re-walk UUID" data-verify="${esc(r.id)}" maxlength="36">`:''}${actions(r)}</div></div>`}
function render(){const box=$('mod');if(!RTW_ON()){box.innerHTML='<p class="empty">The record is not connected yet (src/config.js is empty).</p>';return}
 if(!session){box.innerHTML=`<div class="paper"><h3>Sign in</h3><p class="small">Moderators sign in with a one-time link sent to their email address. Only addresses on the moderators list can see anything after signing in.</p><div class="coordrow"><input type="email" id="m-email" placeholder="you@crashfreeindia.org" autocomplete="email" inputmode="email"><button type="button" class="btn yellow small" id="m-send">Send me a link</button></div><p class="small" id="m-msg"></p></div>`;return}
 box.innerHTML=`<div class="modbar"><span class="small">Signed in as <b>${esc(session.email||'(unknown)')}</b>${isMod===false?' · <b style="color:var(--red)">this address is not on the moderators list</b>':''}</span><button type="button" class="btn small" id="m-out">Sign out</button></div>
 <div class="chips" id="m-tabs">${['pending','published','rejected','test'].map(s=>`<button type="button" class="chip" data-tab="${s}" aria-pressed="${String(s===tab)}">${s}${counts[s]!=null?' '+counts[s]:''}</button>`).join('')}</div>
 ${lastErr?`<p class="err">${esc(lastErr)}</p>`:''}
 <div class="block" id="m-list">${busy?'<p class="small">Loading…</p>':(rows.length?rows.map(rowHTML).join(''):'<p class="empty">Nothing here.</p>')}</div>`;if(!busy)loadPhotos()}
async function folderPhotos(id,folder,t){return await rtwPhotoList(`${folder}/${id}`,t)||[]}
async function loadPhotos(){const t=await tok();if(!t)return;for(const box of document.querySelectorAll('.ph[data-ph]')){const id=box.dataset.ph,folder=box.dataset.folder;try{const list=await folderPhotos(id,folder,t);if(!list.length){box.innerHTML='<span class="small">No photo arrived.</span>';continue}box.innerHTML=`<span class="small">${list.length} photo${list.length===1?'':'s'} found.</span>`;let n=0;for(const f of list){try{const u=await rtwPhotoURL(`${folder}/${id}/${f.name}`,t);const im=document.createElement('img');im.src=u;im.alt=`Observation photo ${++n}`;im.title=f.name;box.appendChild(im)}catch(e){}}}catch(e){box.innerHTML='<span class="small">Could not load photos.</span>'}}}
async function movePhotos(id,from,to,t){const list=await folderPhotos(id,from,t);for(const f of list){await rtwFetch('/storage/v1/object/move',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bucketId:'photos',sourceKey:`${from}/${id}/${f.name}`,destinationKey:`${to}/${id}/${f.name}`})},t)}}
async function ensurePhotos(id,to,t){await movePhotos(id,to==='published'?'pending':'published',to,t);return (await folderPhotos(id,to,t)).length}
async function deletePhotos(id,t){for(const folder of ['pending','published']){const list=await folderPhotos(id,folder,t);if(!list.length)continue;await rtwFetch('/storage/v1/object/photos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:list.map(f=>`${folder}/${id}/${f.name}`)})},t)}}
async function act(action,id,btn){const t=await tok();if(!t){render();return}const r=rows.find(x=>x.id===id);if(!r)return;const noteEl=document.querySelector(`[data-note="${id}"]`);const note=(noteEl&&noteEl.value.trim())||'';
 if(action==='delete'&&!confirm('Delete this row and its photos for good?'))return;
 const patch={moderated_at:new Date().toISOString(),moderated_by:session.email||null,mod_note:note||r.mod_note||null};
 if(action==='publish')patch.status='published';else if(action==='verify'){const value=(document.querySelector(`[data-verify="${id}"]`)?.value||'').trim();if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)){toast('Enter the full UUID of a later published re-walk.');return}patch.verified=true;patch.verification_check_id=value}else if(action==='unverify'){patch.verified=false;patch.verification_check_id=null;patch.verified_at=null}else if(action==='reject')patch.status='rejected';else if(action==='test')patch.status='test';else if(action==='unpublish'){patch.status='pending';patch.verified=false;patch.verification_check_id=null;patch.verified_at=null}else if(action==='restore')patch.status='pending';
 if(btn)btn.disabled=true;
 try{if(action==='delete'){await deletePhotos(id,t);const res=await rtwJSON(`/rest/v1/checks?id=eq.${id}`,{method:'DELETE',headers:{Prefer:'return=representation'}},t);if(!res||!res.length)throw new Error('Nothing deleted (not a moderator?)')}
  else{if(action==='publish')patch.photo_count=await ensurePhotos(id,'published',t);
   if(action==='unpublish')await ensurePhotos(id,'pending',t);
   if(action==='reject'||action==='test')await deletePhotos(id,t);
   const res=await rtwJSON(`/rest/v1/checks?id=eq.${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(patch)},t);if(!res||!res.length)throw new Error('Nothing changed (not a moderator?)')}
  toast('Done');await load()}
 catch(e){toast('Failed: '+(e.message||'error')+'. Retry this action to reconcile photos.');if(btn)btn.disabled=false}}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.id==='m-send'){const em=($('m-email').value||'').trim().toLowerCase();const msg=$('m-msg');if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){msg.textContent='That does not look like an email address.';return}b.disabled=true;msg.textContent='Sending…';try{await sendLink(em);msg.textContent='Sent. Open the link from your email on this device; it brings you back here signed in.'}catch(err){msg.textContent='Could not send: '+(err.message||'error');b.disabled=false}return}
 if(b.id==='m-out'){signOut();return}
 if(b.dataset.tab){tab=b.dataset.tab;load();return}
 if(b.dataset.act){act(b.dataset.act,b.dataset.id,b)}});
document.addEventListener('click',e=>{const im=e.target.closest('.ph img');if(im)im.classList.toggle('big')});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='m-email'){e.preventDefault();$('m-send').click()}});
window.addEventListener('hashchange',()=>{if(parseHash()){isMod=null;load()}});
loadSession();parseHash();if(session)load();else render();
