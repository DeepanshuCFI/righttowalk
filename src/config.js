// ---------- Phase 1 connection (public values; the anon key is meant to ship to browsers) ----------
// Fill in after the Supabase project exists. Leave url empty to run the site without submissions, map or report.
const RTW={
 url:'https://qeiqfkzugpipcvolvhjw.supabase.co',
 anon:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaXFma3p1Z3BpcGN2b2x2aGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NzM3MzMsImV4cCI6MjEwODM0OTczM30.mx3DEJQRMp_Yj20fLUeD_OeMUJUb9q4R2IQBoFZjkG4',
 site:'https://righttowalk.life/',
 tiles:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
 tilesAttr:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
 center:[28.4595,77.0266], zoom:12
};
const RTW_ON=()=>!!(RTW.url&&RTW.anon);
