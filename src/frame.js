// ---------- the sampling frame: Haryana's own road list (src/roads.json, inlined as ROADS) matched to published checks ----------
// A check belongs to a road when its start point is within RTW_ROAD_RADIUS metres of the road's line (nearest road wins).
// Everything here runs in the browser on data already loaded; no new host is called.
const RTW_ROAD_RADIUS=60;
const RTW_ROAD_KIND={master:'master road',iconic:'iconic road'};
function rtwRoadAgency(a){return RTW_OWNER_SHORT[a]||'Not stated'}
function rtwRoadSeg(p,a,b){const ky=111132,kx=111132*Math.cos(p[0]*Math.PI/180);const px=(p[1]-a[1])*kx,py=(p[0]-a[0])*ky,bx=(b[1]-a[1])*kx,by=(b[0]-a[0])*ky;const l2=bx*bx+by*by;const t=l2?Math.max(0,Math.min(1,(px*bx+py*by)/l2)):0;const dx=px-t*bx,dy=py-t*by;return Math.sqrt(dx*dx+dy*dy)}
function rtwRoadDist(p,pts){let m=Infinity;for(let i=0;i<pts.length-1;i++){const d=rtwRoadSeg(p,pts[i],pts[i+1]);if(d<m)m=d}return m}
// -> one entry per road: {road, checks, tested, pass, fail, state} with state none | walked | pass | fail
function rtwRoadsMatch(rows){const res=ROADS.roads.map(r=>({road:r,checks:[],tested:0,pass:0,fail:0,state:'none'}));
 for(const row of rows||[]){if(row.lat==null||row.lon==null)continue;const p=[+row.lat,+row.lon];let best=null,bd=RTW_ROAD_RADIUS;
  for(const s of res){if(!s.road.pts||s.road.pts.length<2)continue;const d=rtwRoadDist(p,s.road.pts);if(d<bd){bd=d;best=s}}
  if(best){best.checks.push(row);if(row.gate==='no')best.fail++;else if(row.gate==='yes')best.pass++;if(row.gate==='no'||row.gate==='yes')best.tested++}}
 for(const s of res)s.state=s.fail?'fail':(s.pass?'pass':(s.checks.length?'walked':'none'));
 return res}
function rtwRoadsSummary(res){return {total:ROADS.frame.total,listed:res.length,walked:res.filter(s=>s.checks.length).length,tested:res.filter(s=>s.tested).length,pass:res.filter(s=>s.state==='pass').length,fail:res.filter(s=>s.fail).length,checks:res.reduce((a,s)=>a+s.checks.length,0),nolines:res.filter(s=>!s.road.pts||s.road.pts.length<2).length}}
function rtwRoadStateText(st){return st==='fail'?'Fails the 100 m test':(st==='pass'?'Passes the 100 m test':(st==='walked'?'Walked, test not answered':'Not yet walked'))}
function rtwRoadLine(sm){return `Of the ${sm.total} roads on Haryana's own audit list, ${sm.walked} ${sm.walked===1?'has':'have'} been walked and ${sm.fail} fail${sm.fail===1?'s':''} the 100 m test.`}
function rtwRoadKm(r){return r.length_m?`about ${(r.length_m/1000).toFixed(1)} km`:'length not known'}
function rtwRoadStretches(r){return r.length_m?Math.max(1,Math.ceil(r.length_m/500)):null}
// sort for tables: failing first, then passing, walked, not yet walked; list order within each
function rtwRoadsSorted(res){const o={fail:0,pass:1,walked:2,none:3};return res.map((s,i)=>[s,i]).sort((a,b)=>(o[a[0].state]-o[b[0].state])||(a[1]-b[1])).map(x=>x[0])}
