// ---------- law page: the home page's string mechanism (English in the HTML, Hindi in learn.js), without the check ----------
let lang=(()=>{try{return localStorage.getItem('fc_lang')||'en'}catch(e){return 'en'}})();if(!S[lang])lang='en';
document.querySelectorAll('[data-s],[data-sh]').forEach(el=>{const k=el.dataset.s||el.dataset.sh;if(S.en[k]==null)S.en[k]=el.dataset.sh?el.innerHTML:el.textContent.trim()});
function apply(){const T=k=>S[lang][k];document.querySelectorAll('[data-s]').forEach(el=>{const v=T(el.dataset.s);if(v!=null)el.textContent=v});document.querySelectorAll('[data-sh]').forEach(el=>{const v=T(el.dataset.sh);if(v!=null)el.innerHTML=v});document.querySelectorAll('[data-hi]').forEach(el=>{const v=S.hi[el.dataset.hi];el.hidden=lang!=='hi'||v==null;if(v!=null)el.textContent=v});const b=document.getElementById('langbtn');if(b)b.textContent=lang==='en'?'हिंदी':'English';document.documentElement.lang=lang==='hi'?'hi':'en'}
document.addEventListener('click',e=>{if(!e.target.closest('#langbtn'))return;lang=lang==='en'?'hi':'en';try{localStorage.setItem('fc_lang',lang)}catch(e2){}apply()});
apply();
