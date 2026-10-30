// Haryana's road list is a planning frame. A nearby pin does not establish coverage of a road.
const RTW_ROAD_RADIUS=60;
const RTW_ROAD_KIND={master:'master road',iconic:'iconic road'};
function rtwRoadAgency(a){return RTW_OWNER_SHORT[a]||'Not stated'}
function rtwRoadSeg(p,a,b){const ky=111132,kx=111132*Math.cos(p[0]*Math.PI/180);const px=(p[1]-a[1])*kx,py=(p[0]-a[0])*ky,bx=(b[1]-a[1])*kx,by=(b[0]-a[0])*ky;const l2=bx*bx+by*by;const t=l2?Math.max(0,Math.min(1,(px*bx+py*by)/l2)):0;const dx=px-t*bx,dy=py-t*by;return Math.sqrt(dx*dx+dy*dy)}
function rtwRoadDist(p,pts){let m=Infinity;for(let i=0;i<pts.length-1;i++){const d=rtwRoadSeg(p,pts[i],pts[i+1]);if(d<m)m=d}return m}
// A check is associated with its nearest approximate road line when its start is within 60 m.
// These are *nearby observations*, never road-wide pass/fail or measured segment coverage.
function rtwRoadsMatch(rows){const res=ROADS.roads.map(r=>({road:r,checks:[],fullTested:0,fullPassed:0,fullFailed:0,spotReports:0,state:'none'}));
 for(const row of rows||[]){if(row.lat==null||row.lon==null)continue;const p=[+row.lat,+row.lon];let best=null,bd=RTW_ROAD_RADIUS;
  for(const s of res){if(!s.road.pts||s.road.pts.length<2)continue;const d=rtwRoadDist(p,s.road.pts);if(d<bd){bd=d;best=s}}
  if(best){best.checks.push(row);if(row.mode==='full'&&row.gate==='no'){best.fullTested++;best.fullFailed++}else if(row.mode==='full'&&row.gate==='yes'){best.fullTested++;best.fullPassed++}if(row.mode==='quick')best.spotReports++}}
 for(const s of res)s.state=s.checks.length?'nearby':'none';
 return res}
function rtwRoadsSummary(res){return {total:ROADS.frame.total,listed:res.length,roadsWithNearby:res.filter(s=>s.checks.length).length,fullTested:res.reduce((a,s)=>a+s.fullTested,0),fullFailed:res.reduce((a,s)=>a+s.fullFailed,0),spotReports:res.reduce((a,s)=>a+s.spotReports,0),checks:res.reduce((a,s)=>a+s.checks.length,0),nolines:res.filter(s=>!s.road.pts||s.road.pts.length<2).length}}
function rtwRoadStateText(s){return s.checks.length?`${s.checks.length} nearby ${s.checks.length===1?'observation':'observations'}`:'No nearby observation'}
function rtwRoadLine(sm){return `${sm.roadsWithNearby} of the ${sm.listed} listed roads have at least one nearby published observation. This does not measure coverage of either side of a road.`}
function rtwRoadKm(r){return r.length_m?`about ${(r.length_m/1000).toFixed(1)} km`:'length not known'}
function rtwRoadStretches(r){return r.length_m?Math.max(1,Math.ceil(r.length_m/500)):null}
// Put observed roads first without sorting by a purported road-wide result.
function rtwRoadsSorted(res){return res.map((s,i)=>[s,i]).sort((a,b)=>(b[0].checks.length-a[0].checks.length)||(a[1]-b[1])).map(x=>x[0])}
