// Dataset guide: distinguish snapshot freshness from the last data change.
(function(){
 const $=id=>document.getElementById(id);
 let lang=rtwLS(()=>localStorage.getItem('rtw_lang'))==='hi'?'hi':'en';
 const tr=(en,hi)=>lang==='hi'?hi:en;
 function applyLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-hi]').forEach(el=>{if(!el.dataset.en)el.dataset.en=el.textContent;el.textContent=lang==='hi'?el.dataset.hi:el.dataset.en});$('d-lang').textContent=lang==='hi'?'English':'हिन्दी'}
 function stamp(s){if(!s)return null;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toLocaleString(lang==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
 async function freshness(){try{const r=await fetch('data/stats.json',{cache:'no-store'});if(!r.ok)throw Error('snapshot unavailable');const j=await r.json();const checked=stamp(j.checked_at),changed=stamp(j.data_changed_at||j.generated);$('d-freshness').textContent=checked?tr(`Last successful check: ${checked}. Last published-data change: ${changed||'unknown'}.`,`आख़िरी सफल जाँच: ${checked}। प्रकाशित डेटा में आख़िरी बदलाव: ${changed||'अज्ञात'}।`):tr(`Last recorded data change: ${changed||'unknown'}. Last successful job run is not recorded in this file.`,`आख़िरी दर्ज डेटा बदलाव: ${changed||'अज्ञात'}। इस फ़ाइल में आख़िरी सफल जॉब रन दर्ज नहीं है।`)}catch(e){$('d-freshness').textContent=tr('Snapshot freshness could not be checked.','स्नैपशॉट की ताज़गी जाँची नहीं जा सकी।')}}
 const el=$('d-api');if(el)el.textContent=RTW_ON()?`${RTW.url}/rest/v1/public_checks?select=*  ·  ${RTW.url}/rest/v1/rpc/public_stats  (send header apikey: <anon key>)`:'(not connected yet)';
 $('d-lang').addEventListener('click',()=>{lang=lang==='hi'?'en':'hi';rtwLS(()=>localStorage.setItem('rtw_lang',lang));applyLang();freshness()});
 applyLang();freshness();
})();
