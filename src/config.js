// ---------- Phase 1 connection (public values; the anon key is meant to ship to browsers) ----------
// Fill in after the Supabase project exists. Leave url empty to run the site without submissions, map or report.
const RTW={
 url:'',
 anon:'',
 site:'https://righttowalk.life/',
 tiles:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
 tilesAttr:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
 center:[28.4595,77.0266], zoom:12
};
const RTW_ON=()=>!!(RTW.url&&RTW.anon);
