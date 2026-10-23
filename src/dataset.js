// ---------- dataset page: show the live endpoints once the record is connected ----------
(function(){const el=document.getElementById('d-api');if(!el)return;if(!RTW_ON()){el.textContent='(not connected yet)';return}
 el.textContent=`${RTW.url}/rest/v1/public_checks?select=*  ·  ${RTW.url}/rest/v1/rpc/public_stats  (send header apikey: <anon key>)`})();
