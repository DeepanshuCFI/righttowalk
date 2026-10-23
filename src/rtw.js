// ---------- Phase 1 shared client: plain fetch against PostgREST, Storage and GoTrue; no SDK ----------
// Every page gets this after config.js. Nothing here runs unless RTW_ON().
function rtwLS(fn){try{return fn()}catch(e){return null}}
function rtwHeaders(tok,extra){return Object.assign({apikey:RTW.anon,Authorization:'Bearer '+(tok||RTW.anon)},extra||{})}
async function rtwFetch(path,opt,tok){opt=opt||{};const r=await fetch(RTW.url+path,Object.assign({},opt,{headers:rtwHeaders(tok,opt.headers)}));
 if(!r.ok){let msg='';try{const j=await r.json();msg=j.message||j.msg||j.error_description||j.error||''}catch(e){}const err=new Error(msg||('HTTP '+r.status));err.status=r.status;throw err}return r}
async function rtwJSON(path,opt,tok){const r=await rtwFetch(path,opt,tok);if(r.status===204)return null;const t=await r.text();return t?JSON.parse(t):null}
function rtwStats(){return rtwJSON('/rest/v1/rpc/public_stats')}
async function rtwRows(path,tok){let out=[],from=0;for(;;){const r=await rtwFetch(path,{headers:{Range:`${from}-${from+999}`,'Range-Unit':'items'}},tok);const rows=await r.json();out=out.concat(rows);if(rows.length<1000)break;from+=1000}return out}
function rtwPublished(){return rtwRows('/rest/v1/public_checks?select=*&order=created_at.desc')}
function rtwSectorStats(){return rtwJSON('/rest/v1/public_sector_stats?select=*&order=checks.desc')}
function rtwOwnerStats(){return rtwJSON('/rest/v1/public_owner_stats?select=*&order=checks.desc')}
function rtwPhotoList(folder,tok){return rtwJSON('/storage/v1/object/list/photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefix:folder,limit:20,offset:0,sortBy:{column:'name',order:'asc'}})},tok)}
async function rtwPhotoURL(path,tok){const r=await rtwFetch('/storage/v1/object/authenticated/photos/'+path,{},tok);return URL.createObjectURL(await r.blob())}
function rtwClientId(){let id=rtwLS(()=>localStorage.getItem('rtw_cid'));if(!id){id=(crypto.randomUUID?crypto.randomUUID():('c'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)));rtwLS(()=>localStorage.setItem('rtw_cid',id))}return id}
function rtwUUID(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
// shrink a photo to a JPEG no wider than max px (also strips EXIF, including any GPS tag)
function rtwShrink(file,max){return new Promise(res=>{const img=new Image();const u=URL.createObjectURL(file);
 img.onload=()=>{try{const k=Math.min(1,(max||1600)/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*k));c.height=Math.max(1,Math.round(img.naturalHeight*k));c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>res(b),'image/jpeg',.82)}catch(e){URL.revokeObjectURL(u);res(null)}};
 img.onerror=()=>{URL.revokeObjectURL(u);res(null)};img.src=u})}
async function rtwUpload(path,blob){return rtwFetch('/storage/v1/object/photos/'+path,{method:'POST',headers:{'Content-Type':blob.type||'image/jpeg','x-upsert':'false','Cache-Control':'3600'},body:blob})}
// ---------- formatting shared by the map, the report and the moderation page ----------
const RTW_OWNER_SHORT={gmda:'GMDA',mcg:'MCG',hsvp:'HSVP',dtcp:'DTCP / coloniser',nhai:'NHAI',pwd:'PWD (B&R)',unknown:'Not sure'};
function rtwEsc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function rtwDate(iso){try{return new Date(iso).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}catch(e){return ''}}
function rtwPlace(r){return r.road||(r.lat!=null?`${(+r.lat).toFixed(4)}, ${(+r.lon).toFixed(4)}`:'Unnamed stretch')}
function rtwObsEntries(obs){return Object.entries(obs||{}).filter(([id,n])=>OBS_BY[id]&&n>0).sort((a,b)=>b[1]-a[1])}
function rtwObsText(obs,lang){return rtwObsEntries(obs).map(([id,n])=>`${lang==='hi'?OBS_BY[id].hi:OBS_BY[id].en}${n>1?' ×'+n:''}`).join(', ')}
function rtwBandText(b){return b==='g'?'Walkable, keep it':(b==='a'?'Walkable with repairs':(b==='r'?'Not walkable':''))}
function rtwPct(a,b){return b?Math.round(a/b*100):null}
function rtwOSM(r){return `https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lon}#map=18/${r.lat}/${r.lon}`}
function rtwShort(id){return String(id||'').slice(0,8).toUpperCase()}
