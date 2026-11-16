'use strict';
const $=id=>document.getElementById(id);
const form=$('searchForm'),queryInput=$('q'),results=$('items'),message=$('message'),count=$('count');
const playerArea=$('player'),playerStatus=$('playStatus'),nowPlaying=$('nowPlaying');
const apiInput=$('apiKey'),keyStatus=$('keyStatus');
let apiKey=localStorage.getItem('gway_youtube_key')||'';
if(apiKey){apiInput.value=apiKey;keyStatus.textContent='Cheie salvată pe acest telefon';}
let queue=[],queueIndex=-1,ytPlayer=null,ytApiReady=false,ytApiLoading=false,archiveMedia=null;
let currentQuery='',ytNextPage='',archivePage=1,archiveTotal=0,moreButton=null,loadingMore=false;
const seenMedia=new Set();
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function setStatus(t){playerStatus.textContent=t;}
function queueLabel(){return queue.length?`Redare continuă · ${queueIndex+1}/${queue.length}`:'Alege un material';}
function loadYouTubeAPI(){
 if(window.YT&&window.YT.Player){ytApiReady=true;return Promise.resolve();}
 return new Promise((resolve,reject)=>{
  if(!ytApiLoading){ytApiLoading=true;window.onYouTubeIframeAPIReady=()=>{ytApiReady=true;resolve();};const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>reject(new Error('Playerul YouTube nu s-a încărcat.'));document.head.append(s);}
  else{const wait=()=>window.YT&&window.YT.Player?(ytApiReady=true,resolve()):setTimeout(wait,150);wait();}
 });
}
function addToQueue(entry){
 const key=entry.type==='youtube'?`yt:${entry.id}`:entry.type==='archive'?`ia:${entry.item.identifier}`:`commons:${entry.pageid}`;
 if(seenMedia.has(key))return false;seenMedia.add(key);
 const index=queue.push(entry)-1;addCard(entry,()=>playAt(index));return true;
}
function addCard(item,play){
 const card=make('article','item'),button=make('button','image-play');button.type='button';button.setAttribute('aria-label','Redă '+item.title);
 if(item.thumb){const img=document.createElement('img');img.className='thumbimg';img.src=item.thumb;img.alt=item.title;img.loading='lazy';img.onerror=()=>{img.style.display='none';};button.append(img);}
 else button.append(make('div','thumb','▶'));
 button.addEventListener('click',play);card.append(button);
 const title=make('div','image-title',item.title);title.addEventListener('click',play);title.setAttribute('role','button');title.tabIndex=0;
 title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play();}});
 const source=make('small','source-label',item.info||'');card.append(title,source);results.append(card);
}
$('saveKey').addEventListener('click',()=>{const v=apiInput.value.trim();if(!v){keyStatus.textContent='Introdu cheia mai întâi';return;}localStorage.setItem('gway_youtube_key',v);apiKey=v;keyStatus.textContent='Cheie salvată pe acest telefon';});
$('forgetKey').addEventListener('click',()=>{localStorage.removeItem('gway_youtube_key');apiKey='';apiInput.value='';keyStatus.textContent='Cheie ștearsă din acest telefon';});
async function searchYouTube(q,pageToken=''){
 if(!apiKey)throw new Error('YouTube: adaugă cheia API în secțiunea Conectare YouTube.');
 const p={part:'snippet',type:'video',maxResults:'50',q,key:apiKey};if(pageToken)p.pageToken=pageToken;
 const r=await fetch('https://www.googleapis.com/youtube/v3/search?'+new URLSearchParams(p)),d=await r.json();
 if(!r.ok)throw new Error(d.error?.message||`YouTube ${r.status}`);ytNextPage=d.nextPageToken||'';let n=0;
 for(const v of d.items||[]){const id=v.id?.videoId;if(!id)continue;const sn=v.snippet||{};
  if(addToQueue({type:'youtube',id,title:sn.title||'Videoclip YouTube',info:`YouTube · ${sn.channelTitle||''}`,thumb:sn.thumbnails?.high?.url||sn.thumbnails?.medium?.url||sn.thumbnails?.default?.url}))n++;
 }return n;
}
async function searchArchive(q,page=1){
 const p=new URLSearchParams({q:`(${q}) AND mediatype:(movies OR audio)`,'fl[]':'identifier,title,description,year,mediatype',rows:'50',page:String(page),output:'json','sort[]':'downloads desc'});
 const r=await fetch(`https://archive.org/advancedsearch.php?${p}`);if(!r.ok)throw new Error(`Internet Archive ${r.status}`);
 const d=await r.json(),docs=d.response?.docs||[];archiveTotal=d.response?.numFound||0;let n=0;
 for(const item of docs){const desc=Array.isArray(item.description)?item.description[0]:(item.description||'');
  if(addToQueue({type:'archive',item,title:item.title||item.identifier,info:`Internet Archive · ${item.year||''}`,description:String(desc).slice(0,120),thumb:`https://archive.org/services/img/${encodeURIComponent(item.identifier)}`}))n++;
 }return {count:n,total:archiveTotal};
}
async function searchCommons(q){
 const p=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:q,gsrnamespace:'6',gsrlimit:'50',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'640'});
 const r=await fetch(`https://commons.wikimedia.org/w/api.php?${p}`);if(!r.ok)throw new Error(`Wikimedia Commons ${r.status}`);
 const d=await r.json(),pages=Object.values(d.query?.pages||{});let n=0;
 for(const page of pages){const ii=page.imageinfo?.[0];if(!ii?.url)continue;
  const ext=(page.title.split('.').pop()||'').toLowerCase(),audio=['ogg','oga','mp3','wav','flac'].includes(ext),video=['webm','ogv','mp4'].includes(ext),image=['jpg','jpeg','png','gif','svg','webp','tif','tiff'].includes(ext);
  if(!audio&&!video&&!image)continue;
  const meta=ii.extmetadata||{},license=meta.LicenseShortName?.value||'Licență de verificat';
  if(addToQueue({type:image?'commons-image':'commons',pageid:page.pageid,title:page.title.replace(/^File:/,''),info:`Wikimedia Commons · ${image?'Imagine':audio?'Audio':'Video'} · ${license}`,mediaUrl:ii.url,thumb:ii.thumburl||ii.url,audio}))n++;
 }return n;
}
function updateMore(){
 const wrap=$('moreResults');wrap.replaceChildren();
 if(!ytNextPage&&archivePage*50>=archiveTotal)return;
 moreButton=make('button','load-more','Încarcă mai multe rezultate');moreButton.addEventListener('click',loadMore);wrap.append(moreButton);
}
async function loadMore(){
 if(loadingMore)return;loadingMore=true;moreButton.disabled=true;moreButton.textContent='Se încarcă…';let added=0,errs=[];
 if(ytNextPage)try{added+=await searchYouTube(currentQuery,ytNextPage);}catch(e){errs.push(e.message);ytNextPage='';}
 if(archivePage*50<archiveTotal)try{archivePage++;added+=(await searchArchive(currentQuery,archivePage)).count;}catch(e){errs.push(e.message);}
 loadingMore=false;count.textContent=`${queue.length} materiale găsite`;message.textContent=added?`Au fost adăugate ${added} materiale.`:'Nu mai sunt rezultate noi.'+(errs.length?' '+errs.join(' | '):'');updateMore();setStatus(queueLabel());
}
async function expandLibrary(){
 if(loadingMore||!currentQuery)return;loadingMore=true;const b=$('expandLibrary');b.disabled=true;b.textContent='Se extinde biblioteca…';
 const savedYtToken=ytNextPage,savedArchiveTotal=archiveTotal,savedArchivePage=archivePage;
 const terms=[`${currentQuery} songs`,`${currentQuery} live concert`,`${currentQuery} official music video`,`${currentQuery} full documentary`];let added=0,errs=[];
 for(const q of terms){for(const fn of [searchYouTube,searchArchive,searchCommons])try{if(fn===searchYouTube)added+=await fn(q,'');else if(fn===searchArchive)added+=(await fn(q,1)).count;else added+=await fn(q);}catch(e){errs.push(e.message);}}
 ytNextPage=savedYtToken;archiveTotal=savedArchiveTotal;archivePage=savedArchivePage;
 count.textContent=`${queue.length} materiale în bibliotecă`;message.textContent=added?`Biblioteca a fost extinsă cu ${added} materiale noi.`:'Nu au fost găsite materiale noi.';if(errs.length)message.textContent+=' '+errs.join(' · ');
 b.disabled=false;b.textContent='Extinde biblioteca din nou';loadingMore=false;updateMore();setStatus(queueLabel());
}
async function playAt(i){
 if(!queue.length)return;queueIndex=((i%queue.length)+queue.length)%queue.length;const e=queue[queueIndex];nowPlaying.textContent=e.title;setStatus(queueLabel());
 if(archiveMedia){archiveMedia.pause();archiveMedia=null;}
 if(e.type==='youtube')return playYouTubeItem(e);
 if(e.type==='commons'||e.type==='commons-image')return playCommons(e);
 return playArchive(e);
}
async function playNext(){if(queue.length)await playAt((queueIndex+1)%queue.length);}
async function playYouTubeItem(e){
 setStatus('Se pregătește playerul YouTube…');
 try{await loadYouTubeAPI();playerArea.replaceChildren();const mount=make('div','ytmount');mount.id='gway-youtube-player';playerArea.append(mount);
 if(ytPlayer?.destroy)try{ytPlayer.destroy();}catch(_){}
 ytPlayer=new YT.Player(mount.id,{videoId:e.id,playerVars:{playsinline:1,rel:0},events:{onReady:x=>x.target.playVideo(),onStateChange:x=>{if(x.data===YT.PlayerState.ENDED)playNext();},onError:()=>setStatus('Acest videoclip nu permite redarea încorporată.')}});setStatus(queueLabel());
 }catch(err){setStatus('Player indisponibil');message.textContent=err.message;}
}
async function playCommons(e){
 if(e.type==='commons-image'){const img=document.createElement('img');img.src=e.mediaUrl;img.alt=e.title;img.style.cssText='display:block;max-width:100%;max-height:65vh;margin:auto;object-fit:contain';playerArea.replaceChildren(img);setStatus('Imagine din Wikimedia Commons');return;}
 const media=document.createElement(e.audio?'audio':'video');media.controls=true;media.playsInline=true;media.preload='metadata';media.src=e.mediaUrl;media.className='archiveplayer';media.addEventListener('ended',playNext);media.addEventListener('error',()=>setStatus('Fișierul Commons nu poate fi redat.'));
 archiveMedia=media;playerArea.replaceChildren(media);setStatus(queueLabel());media.play().catch(()=>setStatus('Apasă Play în player. Următorul material va porni la final.'));
}
async function playArchive(e){
 setStatus('Se verifică fișierele disponibile…');
 try{const r=await fetch(`https://archive.org/metadata/${encodeURIComponent(e.item.identifier)}`);if(!r.ok)throw new Error('Metadatele nu sunt disponibile.');
 const m=await r.json(),files=(m.files||[]).filter(f=>f.name&&!f.name.includes('_thumb')).map(f=>({...f,ext:(f.name.split('.').pop()||'').toLowerCase()})).filter(f=>['mp3','m4a','ogg','oga','wav','mp4','m4v','webm'].includes(f.ext));
 if(!files.length)throw new Error('Nu există un fișier compatibil.');const rank={mp4:0,mp3:1,m4a:2,webm:3,ogg:4,oga:5,wav:6,m4v:7};files.sort((a,b)=>rank[a.ext]-rank[b.ext]);
 const f=files[0],path=f.name.split('/').map(encodeURIComponent).join('/'),audio=['mp3','m4a','ogg','oga','wav'].includes(f.ext),media=document.createElement(audio?'audio':'video');
 media.controls=true;media.playsInline=true;media.preload='metadata';media.src=`https://archive.org/download/${encodeURIComponent(e.item.identifier)}/${path}`;media.className='archiveplayer';media.addEventListener('ended',playNext);media.addEventListener('error',()=>setStatus('Fișierul nu poate fi redat.'));
 archiveMedia=media;playerArea.replaceChildren(media);setStatus(queueLabel());media.play().catch(()=>setStatus('Apasă Play în player.'));
 }catch(err){setStatus('Material indisponibil');message.textContent=err.message;}
}
async function searchMaterials(term){
 const q=String(term||'').trim();if(!q){message.textContent='Scrie un termen de căutare.';return;}
 currentQuery=q;ytNextPage='';archivePage=1;archiveTotal=0;seenMedia.clear();queue=[];queueIndex=-1;
 if(archiveMedia){archiveMedia.pause();archiveMedia=null;}if(ytPlayer?.destroy)try{ytPlayer.destroy();}catch(_){}
 ytPlayer=null;results.replaceChildren();$('moreResults').replaceChildren();$('expandLibrary').hidden=false;
 count.textContent='Se caută…';message.textContent='Caut în YouTube, Internet Archive și Wikimedia Commons…';
 let yt=0,ia=0,wc=0,errs=[];
 try{yt=await searchYouTube(q);}catch(e){errs.push(e.message);}
 try{ia=(await searchArchive(q,1)).count;}catch(e){errs.push(e.message);}
 try{wc=await searchCommons(q);}catch(e){errs.push(e.message);}
 count.textContent=`${queue.length} materiale · ${yt} YouTube · ${ia} Archive · ${wc} Commons`;
 message.textContent=queue.length?'Apasă direct pe imagine pentru redare. Unele rezultate pot avea restricții de redare.':'Nu am găsit rezultate pentru acest termen.';
 if(errs.length)message.textContent+=' '+errs.join(' | ');updateMore();setStatus(queueLabel());
}
$('expandLibrary').addEventListener('click',expandLibrary);
form.addEventListener('submit',e=>{e.preventDefault();searchMaterials(queryInput.value);});
document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{queryInput.value=b.dataset.q;searchMaterials(b.dataset.q);}));
