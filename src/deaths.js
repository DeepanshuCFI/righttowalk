// ---------- deaths on record: pedestrians killed in Gurugram where a public record states what the road lacked ----------
// Data: src/deaths.json, inlined as DEATHS at build time. Every case carries its sources; nothing here infers a cause.
// A case is "walked" when a published check starts within RTW_DEATH_RADIUS m of it, and "on a failing stretch" when
// one of those checks failed the Court's 100 m test. All matching runs in the browser on data already loaded.
const RTW_DEATH_RADIUS=60;
const RTW_AGE={child:'a child',teen:'a teenager',adult:'an adult',elderly:'an elderly person',unknown:'a pedestrian'};
function rtwDistM(a,b){const R=6371000,r=x=>x*Math.PI/180;const dLat=r(b[0]-a[0]),dLon=r(b[1]-a[1]);const s=Math.sin(dLat/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(s))}
function rtwDeaths(){return (typeof DEATHS!=='undefined'&&DEATHS&&DEATHS.cases)?DEATHS.cases.slice():[]}
function rtwDeathPlaced(c){return c.lat!=null&&c.lon!=null}
// -> one entry per case: {c, checks, fail, pass}
function rtwDeathsMatch(rows){return rtwDeaths().map(c=>{const near=rtwDeathPlaced(c)?(rows||[]).filter(r=>r.lat!=null&&rtwDistM([+c.lat,+c.lon],[+r.lat,+r.lon])<=RTW_DEATH_RADIUS):[];return {c,checks:near,fail:near.filter(r=>r.gate==='no').length,pass:near.filter(r=>r.gate==='yes').length}})}
function rtwDeathCount(c){return Math.max(1,+(c.count||1))}
function rtwDeathsSummary(res){const dates=res.map(x=>x.c.date).filter(Boolean).sort();const n=xs=>xs.reduce((a,x)=>a+rtwDeathCount(x.c),0);return {total:n(res),incidents:res.length,walked:res.filter(x=>x.checks.length).length,failing:res.filter(x=>x.fail).length,first:dates[0]||null,last:dates[dates.length-1]||null,children:res.reduce((a,x)=>a+rtwDeathAges(x.c,['child','teen']),0),elderly:res.reduce((a,x)=>a+rtwDeathAges(x.c,['elderly']),0)}}
// ages in an entry: a breakdown when one incident killed people of different ages, else the entry's own age band
function rtwDeathAges(c,bands){if(c.breakdown)return bands.reduce((a,b)=>a+(+(c.breakdown[b]||0)),0);return bands.includes(c.age)?rtwDeathCount(c):0}
function rtwDeathWho(c){const who=c.age_text?c.age_text:(RTW_AGE[c.age]||RTW_AGE.unknown);return `${who.charAt(0).toUpperCase()+who.slice(1)}${c.doing?` ${c.doing}`:''}`}
function rtwDeathLine(c){return `${rtwDeathWho(c)} ${c.how||'was killed'}`}
function rtwDeathDate(c){return c.date?rtwDate(c.date):(c.date_text||'date not on record')}
function rtwDeathSource(c,i){const s=(c.sources||[])[i==null?(c.fact_source||0):i];return s?`<a href="${rtwEsc(s.url)}" target="_blank" rel="noopener">${rtwEsc(s.outlet)}${s.date?', '+rtwDate(s.date):''}</a>`:''}
function rtwDeathWalkURL(c){if(!rtwDeathPlaced(c))return '';return `index.html?at=${(+c.lat).toFixed(4)},${(+c.lon).toFixed(4)}&road=${encodeURIComponent(c.place||'')}#check`}
function rtwDeathsLine(sm){if(!sm.total)return 'No death is on this record yet.';const y=sm.first?new Date(sm.first).getFullYear():'';return `${sm.total} pedestrian ${sm.total===1?'death':'deaths'} on the public record${y?` since ${y}`:''}: ${sm.children} ${sm.children===1?'child or teenager':'children or teenagers'}, ${sm.elderly} elderly. ${sm.walked} of the ${sm.incidents} ${sm.walked===1?'stretch has':'stretches have'} been walked since; ${sm.failing} ${sm.failing===1?'fails':'fail'} the 100 m test today.`}
