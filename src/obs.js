// ---------- footpath problem types ----------
// Reconciled 23 Oct 2026 against research_notes/.../footpath_problem_taxonomy.md (21-row taxonomy, 91 sources):
// the twelve first-screen types that cover almost all counted cases, plus three second-screen types (more:true) for Gurugram realism.
// Absence, discontinuity, height and dark zones are audit items 1, 9 and 8, not palette tiles.
// sev: 'off' forces you onto the road · 'fall' trip, fall or injury hazard · 'narrow' narrows the path · 'comfort'
const OBS=[
 {id:'parked',en:'Parked vehicles',hi:'फुटपाथ पर पार्किंग, खड़ी गाड़ियाँ',sev:'off',
  who:'Gurugram Traffic Police (challan, towing); MCG or GMDA for bollards',
  rule:'Rules of the Road Regulations 1989, reg. 15(2)(ii): a driver shall not park on a footpath; IRC:103-2012 cl. 6.12: bollards with a clear gap of 1,200 mm',
  fix:'Enforce regulation 15 (challan and tow) and fit kerb-edge bollards with a 1.2 m clear gap so vehicles cannot mount the footpath while wheelchairs pass',
  desc:'Cars and two-wheelers parked on the footpath, usually at shops and markets. In ITDP’s Chennai audit parking was 40% of all obstructions counted, the largest single type.'},
 {id:'vendor',en:'Vendor cart, kiosk or tin shed',hi:'रेहड़ी-पटरी, ठेला, खोखा, टीन शेड',sev:'off',
  who:'MCG street-vending team and Town Vending Committee on MCG roads and markets; GMDA Enforcement on master roads; HSVP Estate Office in sector markets',
  rule:'Street Vendors Act 2014 s.3(3) (no eviction before the survey), s.18 (30 days’ notice), s.28 (penalty up to ₹2,000); Haryana Municipal Street Vendors Act 2014 s.16; IRC:103-2012 cl. 6.11 and the 2022 draft cl. 6.10 (vending managed so it does not hinder pedestrians); Haryana Municipal Corporation Act 1994 s.408',
  fix:'Mark a vending zone in the multi-utility strip and certify vendors through the Town Vending Committee; remove un-certified fixed structures after notice; keep the walking zone clear',
  desc:'Vending is lawful and belongs in a designed vending zone; count a cart only when it leaves no way past. Permanent khokhas and tin sheds are different: GMDA’s 2026 survey counted 600 to 700 of them on Gurugram roads.'},
 {id:'shop',en:'Shop or house spilling onto it',hi:'दुकान का सामान बाहर, काउंटर, चबूतरा, सीढ़ियाँ',sev:'narrow',
  who:'MCG (s.408 notices, zonal enforcement teams); DTP Enforcement in licensed colonies; HSVP in sector markets; GMDA on master roads',
  rule:'Haryana Municipal Corporation Act 1994 s.408 (removal of encroachments; 9,505 removals in Gurugram 2015 to 2023); IRC:103 walking-zone clearance',
  fix:'Remove goods, counters, platforms and steps back to the building line and mark the frontage line',
  desc:'Display goods, a counter, a raised platform, steps or a canopy that a shop or house extends over the footpath.'},
 {id:'ramp',en:'Private ramp or fence over it',hi:'रैंप, ग्रिल, चारदीवारी, गार्ड रूम',sev:'off',
  who:'DTP Enforcement in licensed colonies (DLF, Sushant Lok, Palam Vihar); MCG in taken-over colonies; HSVP in sectors; GMDA on master roads and drains',
  rule:'IRC:103-2012: minimise driveways crossing the footpath and keep it continuous; 2022 draft: the footpath continues at one level across property entrances, with vehicle ramps inside the kerb zone; MCG public notice, Aug 2026: ramps cut carriageway width and cause waterlogging',
  fix:'Demolish the ramp or fence, restore the footpath level and allow only a short driveway ramp inside the kerb zone',
  desc:'Concrete ramps poured over the roadside drain, fences, lawns and guard cabins pushed onto public land. GMDA pulled down hundreds of ramps along 60 km in four days in 2026; DTP counted 650 in Palam Vihar alone.'},
 {id:'electric',en:'Electric pole, box or transformer',hi:'बिजली का खंभा, ट्रांसफ़ॉर्मर, फ़ीडर पिलर, जंक्शन बॉक्स',sev:'off',
  who:'DHBVN for poles, transformers and feeder pillars; the MCG or GMDA street-light wing and its contractors for lamp posts; the road owner coordinates shifting',
  rule:'IRC:103-2012 cl. 6.1.3 and 6.1.4: no utility poles or electric, water or telecom boxes within the walking zone; Electricity Act 2003 s.67; Bombay High Court, April 2025: the convenience of service providers does not take precedence over pedestrian rights',
  fix:'Relocate the pole, box or transformer to the multi-utility zone or underground it, and secure exposed wiring',
  desc:'Utility hardware planted in the walking zone, often with exposed wiring. Bengaluru found 9,000 of its 45,000 transformers on footpaths in 2014; a Gurugram footpath electrocution near IFFCO Chowk metro was traced to a streetlight contractor.'},
 {id:'green',en:'Tree or bushes in the path',hi:'पेड़ बीच में, झाड़ियाँ, नीची टहनियाँ, ट्री गार्ड',sev:'narrow',
  who:'Horticulture wing of MCG (internal roads) or GMDA (master roads and green belts); HSVP Horticulture; felling needs Forest Department permission',
  rule:'IRC:103-2012 cl. 6.1.4 (no trees or branches within the clear height and width) and cl. 6.1.10.2 (vegetation at least 2.2 m clear); 2022 draft: tree pits of about 1.8 × 1.8 m in the multi-utility zone with surmountable gratings',
  fix:'Prune to 2.2 m clear height, re-align the walking zone around existing trees with level tree grates, and never cut the tree',
  desc:'Trees planted in the walking zone, hedges grown across it, branches below head height. The fix is to design around the tree, not to remove it.'},
 {id:'manhole',en:'Open manhole or drain',hi:'खुला मैनहोल, ढक्कन गायब, खुला नाला, स्लैब गायब',sev:'fall',
  who:'The owner of the line: MCG for colony sewers (Public Health wing), GMDA for master sewers and the storm drains along master roads, HSVP in un-transferred sectors, NHAI for highway drains',
  rule:'IRC:103-2012 cl. 6.1.8: service covers should not sit on footpaths and must be non-slip and flush; IS 1726:1991 and IS 12592:2002 cover grades; Delhi High Court (Mayur Vihar): the tragedy could have been avoided had the drain been covered and barricaded',
  fix:'Cover immediately with the right grade of cover, flush with the surface and lockable; barricade until done; inspect the whole line',
  desc:'An open, sunken or uncovered chamber or drain. NCRB counted 195 deaths from falls into manholes and sewers in 2024, up from 117 in 2023; Gurugram had over 500 open manholes reported in 2023. The most urgent item on this list.'},
 {id:'slab',en:'Broken, uneven or missing tiles',hi:'टूटा फुटपाथ, उखड़ी टाइलें, गड्ढे, धँसी स्लैब',sev:'fall',
  who:'Road owner: MCG on internal roads, GMDA on master roads, HSVP in sectors',
  rule:'IRC:103-2012 cl. 6.1.6: a firm, even paved surface, gratings aligned across the direction of travel, joint gaps no more than 5 mm',
  fix:'Re-lay firm, even paving, fix loose slabs so they cannot lift, and align gratings across the walking direction',
  desc:'Pavers lifted, slabs sunk, potholes in the footpath. People trip, or step onto the road to avoid it.'},
 {id:'dug',en:'Dug up and left',hi:'खुदा हुआ फुटपाथ, केबल की खुदाई, मिट्टी के ढेर',sev:'off',
  who:'The utility that cut it (telecom contractor, gas, DHBVN, GMDA water or sewer) under a road-cutting permission from MCG or GMDA, which must enforce restoration',
  rule:'Road-cutting permission conditions; IRC:103-2012 cl. 6.1.3 and 6.10: no utility ducts under the walking zone, ducts in the multi-utility zone',
  fix:'Reinstate the original paving within the permission period and recover the cost from the utility’s deposit; put future lines in ducts under the multi-utility zone',
  desc:'A trench opened for a cable or pipe and back-filled with rubble, or not at all.'},
 {id:'waste',en:'Malba or garbage',hi:'मलबा, बिल्डिंग मटीरियल, कूड़ा, डंपिंग पॉइंट',sev:'narrow',
  who:'MCG Sanitation (ward teams and the Sanitation Security Force) for garbage; the builder for construction malba, enforced by MCG and DTP; GMDA Enforcement on master roads',
  rule:'Construction and Demolition Waste Management Rules 2016; Solid Waste Management Rules 2016; Haryana Municipal Corporation Act 1994 s.408; IRC:103-2012 cl. 3(iii): bins on one side of the footpath',
  fix:'Clear the material, fine the dumper, send construction waste to the authorised facility and move bins to the furniture zone',
  desc:'Sand, bricks and rubble stored by a site next door, or an informal dumping point that has taken over the path. In Mumbai’s August 2026 enforcement ledger, stored goods and structures outnumbered parked vehicles ten to one.'},
 {id:'furniture',en:'Signboard, bus stop or furniture in the path',hi:'होर्डिंग, यूनिपोल, बस स्टॉप, शौचालय, पुल की सीढ़ियाँ',sev:'narrow',
  who:'MCG Advertising Wing for boards (Haryana Municipal Advertisement Bye-laws 2022); GMDA for unipoles on its land; GMDA or MCG for bus shelters; GMDA or NHAI for foot-over-bridges',
  rule:'IRC:103-2012 cl. 6.1.10.2 (obstacles below 2.2 m may project at most 100 mm) and cl. 6.11.4 (furniture placed in a straight line in the multi-utility zone)',
  fix:'Move the board, shelter or stair landing into the furniture line with 2 m clear behind it, and remove unauthorised advertising',
  desc:'Hoardings, unipoles, bus shelters, toilets, barricades and bridge staircases placed across the walking line instead of in the furniture zone. Gurugram had over 400 unipoles counted in 2024.'},
 {id:'water',en:'Waterlogged or silted',hi:'जलभराव, कीचड़, गाद, सीवर ओवरफ़्लो',sev:'off',
  who:'MCG for internal drains and sewers; GMDA for master drains',
  rule:'IRC:103-2012 cl. 6.1.6: paving laid to even falls, with working drains',
  fix:'Lay the paving to even falls, desilt and fix the drain or sewer',
  desc:'Standing water, mud or sewer overflow that makes the path unusable after rain. Gurugram mapped 155 waterlogging hotspots in 2026.'},
 {id:'riding',more:true,en:'Two-wheelers riding on it',hi:'फुटपाथ पर बाइक चलाना',sev:'fall',
  who:'Gurugram Traffic Police',
  rule:'Rules of the Road Regulations 1989, reg. 11: a driver shall not drive on a footpath except with police permission; Motor Vehicles Act s.184',
  fix:'Fit bollards with a 1.2 m clear gap at the ends of the stretch and enforce regulation 11',
  desc:'Riders use the pavement to bypass a jam; walkers have to step aside.'},
 {id:'cattle',more:true,en:'Stray cattle or dogs',hi:'आवारा पशु, सांड, कुत्ते',sev:'fall',
  who:'MCG veterinary wing (cattle helpline) and its catching agencies',
  rule:'Municipal law on stray animals; MCG’s own survey put stray cattle at about 11,000',
  fix:'Catch and shelter the animals and act against the dairies that release them',
  desc:'Cattle gathering at gates and markets, or a shed built on the path; older residents avoid walking past.'},
 {id:'shrine',more:true,en:'Shrine, statue or memorial',hi:'मंदिर, मज़ार, मूर्ति',sev:'narrow',
  who:'District administration (Deputy Commissioner) with MCG or GMDA, under the state policy ordered by the Supreme Court',
  rule:'Supreme Court order of 29 September 2009 (Union of India v. State of Gujarat): no new unauthorised religious structures on roads or pavements; extended to statues in 2013',
  fix:'No new structures; review existing ones under the 2009 order and keep the walking zone clear around them',
  desc:'A religious or memorial structure occupying the walkway.'}
];
const OBS_BY=Object.fromEntries(OBS.map(o=>[o.id,o]));
const SEV_LBL={en:{off:'Forces you onto the road',fall:'Fall or injury hazard',narrow:'Narrows the path',comfort:'Comfort'},hi:{off:'सड़क पर उतरना पड़ता है',fall:'गिरने या चोट का ख़तरा',narrow:'रास्ता संकरा',comfort:'सुविधा'}};
// glyphs are drawn against the footpath band: x = centre, b = 150 (kerb line); they rise from the bottom
function obsGlyph(id,x,b){b=b||150;
 const car=(cx)=>`<rect x="${cx-34}" y="${b-42}" width="68" height="32" rx="9" style="fill:var(--s-ink2)"/><rect x="${cx-22}" y="${b-56}" width="44" height="20" rx="7" style="fill:var(--s-ink2)"/><rect x="${cx-17}" y="${b-52}" width="14" height="11" rx="2" style="fill:var(--s-chalk);opacity:.7"/><rect x="${cx+3}" y="${b-52}" width="14" height="11" rx="2" style="fill:var(--s-chalk);opacity:.7"/><circle cx="${cx-20}" cy="${b-8}" r="8" style="fill:var(--s-ink)"/><circle cx="${cx+20}" cy="${b-8}" r="8" style="fill:var(--s-ink)"/>`;
 const bike=(cx)=>`<circle cx="${cx-13}" cy="${b-9}" r="9" style="fill:none;stroke:var(--s-ink);stroke-width:3.5"/><circle cx="${cx+13}" cy="${b-9}" r="9" style="fill:none;stroke:var(--s-ink);stroke-width:3.5"/><path d="M${cx-13} ${b-9} L${cx-3} ${b-30} L${cx+8} ${b-30} L${cx+13} ${b-9} M${cx-3} ${b-30} L${cx-10} ${b-39} M${cx+8} ${b-30} L${cx+16} ${b-41} L${cx+21} ${b-41}" style="fill:none;stroke:var(--s-ink);stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round"/><rect x="${cx-8}" y="${b-35}" width="18" height="8" rx="3" style="fill:var(--s-ink2)"/>`;
 const tin=(cx,w,h)=>`<rect x="${cx-w/2}" y="${b-h}" width="${w}" height="${h}" style="fill:var(--s-ink2)"/>${[-2,-1,0,1,2].map(i=>`<path d="M${cx+i*(w/5)} ${b-h} V${b}" style="stroke:var(--s-ink);stroke-width:2;opacity:.55"/>`).join('')}<path d="M${cx-w/2-6} ${b-h} H${cx+w/2+6} L${cx+w/2} ${b-h-12} H${cx-w/2} Z" style="fill:var(--s-ink)"/>`;
 const cart=(cx)=>`<rect x="${cx-24}" y="${b-42}" width="48" height="26" rx="4" style="fill:var(--s-ink2)"/><circle cx="${cx-12}" cy="${b-8}" r="8" style="fill:none;stroke:var(--s-ink);stroke-width:3.5"/><circle cx="${cx+12}" cy="${b-8}" r="8" style="fill:none;stroke:var(--s-ink);stroke-width:3.5"/><path d="M${cx} ${b-42} V${b-76}" style="stroke:var(--s-ink);stroke-width:3"/><path d="M${cx-34} ${b-68} A34 34 0 0 1 ${cx+34} ${b-68} Z" style="fill:var(--s-yellow);stroke:var(--s-ink);stroke-width:2"/><path d="M${cx-12} ${b-68} A12 24 0 0 1 ${cx+12} ${b-68}" style="fill:var(--s-red)"/>`;
 const pole=(cx,h)=>`<rect x="${cx-4}" y="${b-h}" width="8" height="${h}" style="fill:var(--s-ink)"/><rect x="${cx-20}" y="${b-h+6}" width="40" height="5" style="fill:var(--s-ink)"/><circle cx="${cx-16}" cy="${b-h+2}" r="3.5" style="fill:var(--s-ink2)"/><circle cx="${cx+16}" cy="${b-h+2}" r="3.5" style="fill:var(--s-ink2)"/>`;
 const box=(cx)=>`<rect x="${cx-26}" y="${b-50}" width="52" height="42" rx="3" style="fill:var(--s-ink2);stroke:var(--s-ink);stroke-width:2"/>${[-18,-9,0,9,18].map(i=>`<path d="M${cx+i} ${b-44} V${b-14}" style="stroke:var(--s-ink);stroke-width:2;opacity:.6"/>`).join('')}<rect x="${cx-30}" y="${b-8}" width="60" height="8" style="fill:var(--s-ink)"/><path d="M${cx-11} ${b-57} L${cx} ${b-77} L${cx+11} ${b-57} Z" style="fill:var(--s-yellow);stroke:var(--s-ink);stroke-width:2"/><path d="M${cx+2} ${b-73} L${cx-3} ${b-66} H${cx+2} L${cx-2} ${b-60}" style="fill:none;stroke:var(--s-ink);stroke-width:2.2;stroke-linecap:round"/>`;
 const tree=(cx)=>`<rect x="${cx-7}" y="${b-40}" width="14" height="40" style="fill:var(--s-dirt2)"/><circle cx="${cx}" cy="${b-62}" r="26" style="fill:var(--s-tree)"/><circle cx="${cx-17}" cy="${b-50}" r="15" style="fill:var(--s-tree)"/><circle cx="${cx+17}" cy="${b-52}" r="15" style="fill:var(--s-tree)"/>`;
 const bush=(cx)=>`<ellipse cx="${cx-14}" cy="${b-12}" rx="18" ry="12" style="fill:var(--s-tree)"/><ellipse cx="${cx+8}" cy="${b-18}" rx="22" ry="16" style="fill:var(--s-tree)"/><path d="M${cx} ${b-30} l-5 -16 M${cx+12} ${b-32} l4 -18" style="stroke:var(--s-tree);stroke-width:4;stroke-linecap:round"/>`;
 const board=(cx)=>`<rect x="${cx-30}" y="${b-84}" width="60" height="38" style="fill:var(--s-chalk);stroke:var(--s-ink);stroke-width:3"/><rect x="${cx-22}" y="${b-76}" width="34" height="7" style="fill:var(--s-red)"/><rect x="${cx-22}" y="${b-64}" width="46" height="5" style="fill:var(--s-ink2)"/><rect x="${cx-22}" y="${b-56}" width="26" height="5" style="fill:var(--s-ink2)"/><rect x="${cx-4}" y="${b-46}" width="8" height="46" style="fill:var(--s-ink)"/>`;
 const shelter=(cx)=>`<rect x="${cx-36}" y="${b-70}" width="72" height="9" style="fill:var(--s-ink)"/><rect x="${cx-30}" y="${b-61}" width="6" height="61" style="fill:var(--s-ink)"/><rect x="${cx+24}" y="${b-61}" width="6" height="61" style="fill:var(--s-ink)"/><rect x="${cx-22}" y="${b-28}" width="44" height="7" style="fill:var(--s-ink2)"/><rect x="${cx-18}" y="${b-21}" width="5" height="21" style="fill:var(--s-ink2)"/><rect x="${cx+13}" y="${b-21}" width="5" height="21" style="fill:var(--s-ink2)"/><rect x="${cx-16}" y="${b-57}" width="32" height="20" style="fill:var(--s-chalk);opacity:.7"/>`;
 switch(OBS_BY[id]?id:'waste'){
  case 'parked':return car(x-14)+bike(x+36);
  case 'vendor':return tin(x+26,46,56)+cart(x-18);
  case 'shop':return `<rect x="${x-32}" y="${b-52}" width="64" height="52" style="fill:var(--s-plot2);stroke:var(--s-ink);stroke-width:2"/><path d="M${x-40} ${b-50} H${x+40} L${x+32} ${b-68} H${x-32} Z" style="fill:var(--s-red)"/>${[-30,-15,0,15,30].map(i=>`<path d="M${x+i} ${b-50} V${b-68}" style="stroke:var(--s-chalk);stroke-width:3;opacity:.8"/>`).join('')}<rect x="${x-26}" y="${b-30}" width="18" height="18" style="fill:var(--s-ink2)"/><rect x="${x-4}" y="${b-24}" width="24" height="12" style="fill:var(--s-ink2)"/><rect x="${x+2}" y="${b-40}" width="16" height="12" style="fill:var(--s-ink)"/><rect x="${x+34}" y="${b-10}" width="24" height="10" style="fill:var(--s-plot2);stroke:var(--s-ink);stroke-width:2"/>`;
  case 'ramp':return `<path d="M${x-44} ${b} L${x+44} ${b} L${x+44} ${b-26} L${x-44} ${b-6} Z" style="fill:var(--s-plot2);stroke:var(--s-ink);stroke-width:2"/>${[-30,-10,10,30].map((i,k)=>`<path d="M${x+i} ${b-(9+k*4.7)} V${b}" style="stroke:var(--s-ink);stroke-width:2;opacity:.5"/>`).join('')}<path d="M${x-44} ${b-6} L${x+44} ${b-26}" style="stroke:var(--s-ink);stroke-width:3"/><path d="M${x+20} ${b-28} V${b-60} M${x+32} ${b-30} V${b-60} M${x+44} ${b-26} V${b-60} M${x+16} ${b-56} H${x+48}" style="stroke:var(--s-ink);stroke-width:3"/>`;
  case 'electric':return pole(x-32,100)+box(x+14);
  case 'green':return tree(x-14)+bush(x+26);
  case 'manhole':return `<ellipse cx="${x}" cy="${b-6}" rx="22" ry="9" style="fill:var(--s-ink)"/><ellipse cx="${x+26}" cy="${b-16}" rx="20" ry="8" style="fill:var(--s-ink2);stroke:var(--s-ink);stroke-width:2;transform-box:fill-box;transform-origin:center;transform:rotate(-20deg)"/><path d="M${x-30} ${b-30} L${x-12} ${b-30} M${x-21} ${b-39} L${x-21} ${b-21}" style="stroke:var(--s-red);stroke-width:4;stroke-linecap:round"/>`;
  case 'slab':return `<rect x="${x-26}" y="${b-14}" width="52" height="14" style="fill:var(--s-ink)"/><path d="M${x-34} ${b-14} L${x-26} ${b-24} L${x-14} ${b-14} Z M${x+6} ${b-14} L${x+14} ${b-28} L${x+30} ${b-14} Z" style="fill:var(--s-plot2);stroke:var(--s-ink);stroke-width:2"/><path d="M${x-8} ${b-6} h12" style="stroke:var(--s-ink2);stroke-width:2"/>`;
  case 'dug':return `<rect x="${x-40}" y="${b-12}" width="80" height="12" style="fill:var(--s-dirt2)"/><ellipse cx="${x+22}" cy="${b-16}" rx="24" ry="12" style="fill:var(--s-dirt)"/><path d="M${x-44} ${b-30} H${x+44}" style="stroke:var(--s-red);stroke-width:6;stroke-dasharray:10 8"/><rect x="${x-46}" y="${b-50}" width="4" height="50" style="fill:var(--s-ink)"/><rect x="${x+42}" y="${b-50}" width="4" height="50" style="fill:var(--s-ink)"/>`;
  case 'waste':return `<path d="M${x-40} ${b} L${x-24} ${b-32} L${x-8} ${b-20} L${x+4} ${b-40} L${x+26} ${b} Z" style="fill:var(--s-dirt2)"/><rect x="${x-16}" y="${b-16}" width="13" height="7" style="fill:var(--s-red)"/><rect x="${x-1}" y="${b-16}" width="13" height="7" style="fill:var(--s-red)"/><rect x="${x-9}" y="${b-24}" width="13" height="7" style="fill:var(--s-red)"/><ellipse cx="${x+36}" cy="${b-12}" rx="16" ry="12" style="fill:var(--s-ink)"/><ellipse cx="${x+26}" cy="${b-26}" rx="12" ry="9" style="fill:var(--s-ink2)"/>`;
  case 'furniture':return shelter(x-14)+board(x+36);
  case 'water':return `<ellipse cx="${x}" cy="${b-8}" rx="46" ry="9" style="fill:var(--s-water)"/><path d="M${x-26} ${b-9} q6 -4 12 0 q6 4 12 0 M${x+2} ${b-6} q6 -4 12 0" style="fill:none;stroke:var(--s-chalk);stroke-width:2;opacity:.8"/>`;
  case 'riding':return bike(x+6)+`<path d="M${x-40} ${b-30} H${x-24} M${x-44} ${b-20} H${x-26} M${x-38} ${b-10} H${x-26}" style="stroke:var(--s-ink2);stroke-width:3;stroke-linecap:round"/><circle cx="${x+10}" cy="${b-54}" r="6" style="fill:var(--s-ink)"/><path d="M${x+10} ${b-48} L${x+6} ${b-34} M${x+10} ${b-46} L${x+20} ${b-41}" style="stroke:var(--s-ink);stroke-width:4;stroke-linecap:round"/>`;
  case 'cattle':return `<ellipse cx="${x}" cy="${b-30}" rx="34" ry="18" style="fill:var(--s-ink2)"/><rect x="${x+24}" y="${b-50}" width="22" height="22" rx="8" style="fill:var(--s-ink2)"/><path d="M${x+28} ${b-50} l-4 -10 M${x+42} ${b-50} l4 -10" style="stroke:var(--s-ink);stroke-width:3;stroke-linecap:round"/>${[-26,-10,8,22].map(i=>`<rect x="${x+i}" y="${b-16}" width="6" height="16" style="fill:var(--s-ink)"/>`).join('')}`;
  case 'shrine':return `<rect x="${x-30}" y="${b-40}" width="60" height="40" style="fill:var(--s-plot2);stroke:var(--s-ink);stroke-width:2"/><path d="M${x-30} ${b-40} Q${x} ${b-88} ${x+30} ${b-40} Z" style="fill:var(--s-yellow);stroke:var(--s-ink);stroke-width:2"/><path d="M${x} ${b-70} V${b-100} L${x+16} ${b-94} L${x} ${b-88}" style="fill:var(--s-red);stroke:var(--s-ink);stroke-width:1.5"/><rect x="${x-8}" y="${b-24}" width="16" height="24" style="fill:var(--s-ink)"/>`;
  default:return `<path d="M${x-30} ${b} L${x-10} ${b-30} L${x+10} ${b-16} L${x+30} ${b} Z" style="fill:var(--s-dirt2)"/>`}
}
// stand-alone icon with a slice of footpath and kerb under it
function obsIcon(id,cls){return `<svg class="${cls||'obicon'}" viewBox="0 30 100 140" aria-hidden="true"><rect x="0" y="30" width="100" height="120" style="fill:var(--s-paver)"/><path d="M0 70H100M0 110H100M50 30V70M25 70V110M75 70V110M50 110V150" style="stroke:var(--s-line);stroke-width:1.5"/>${obsGlyph(id,50,150)}<rect x="0" y="150" width="50" height="12" style="fill:var(--s-yellow)"/><rect x="50" y="150" width="50" height="12" style="fill:var(--s-ink)"/><rect x="0" y="162" width="100" height="8" style="fill:var(--s-asphalt)"/></svg>`}
