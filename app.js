const form=document.getElementById('searchForm');
const query=document.getElementById('query');
const results=document.getElementById('results');
const notice=document.getElementById('notice');
function search(term){
  const q=term.trim();
  if(!q){query.focus();return}
  notice.innerHTML='<strong>Rezultate pentru „'+escapeHtml(q)+'”</strong><p>Se deschide căutarea YouTube într-o filă nouă. Integrarea API G-Way va fi adăugată după configurarea cheii oficiale.</p>';
  results.innerHTML='<a class="search-result" href="https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'" target="_blank" rel="noopener"><div class="thumb demo-thumb"><span>▶ YouTube</span></div><strong>Vezi rezultatele pentru „'+escapeHtml(q)+'” pe YouTube</strong><p>Deschide căutarea în YouTube</p></a>';
  window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q),'_blank','noopener');
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
form.addEventListener('submit',e=>{e.preventDefault();search(query.value)});
document.getElementById('focusSearch').addEventListener('click',()=>query.focus());
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');
 if(b.dataset.term){query.value=b.dataset.term;search(b.dataset.term)}else{query.value='';notice.innerHTML='<strong>Bun venit la G-Way!</strong><p>Alege o categorie sau caută un videoclip.</p>';results.innerHTML=''}
}));
['shorts','create','subscriptions','library'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{notice.innerHTML='<strong>Funcție în lucru</strong><p>Această secțiune va fi disponibilă într-o versiune viitoare G-Way.</p>'}));
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
