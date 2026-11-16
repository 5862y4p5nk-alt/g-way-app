'use strict';
const form=document.getElementById('searchForm'),queryInput=document.getElementById('q'),results=document.getElementById('items'),message=document.getElementById('message'),count=document.getElementById('count');
const playerArea=document.getElementById('player'),playerStatus=document.getElementById('playStatus'),nowPlaying=document.getElementById('nowPlaying');
const apiInput=document.getElementById('apiKey'),keyStatus=document.getElementById('keyStatus');
let apiKey=localStorage.getItem('gway_youtube_key')||'';
if(apiKey){apiInput.value=apiKey;keyStatus.textContent='Cheie salvată pe acest telefon';}
let queue=[],queueIndex=-1,ytPlayer=null,ytApiReady=false,ytApiLoading=false,archiveMedia=null,searchSerial=0;
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function queueLabel(){return queue.length?`Redare continuă · ${queueIndex+1}/${queue.length} · repetare activă`: 'Alege un material';}
function setStatus(text){playerStatus.textContent=text;}
function loadYouTubeAPI(){
 if(ytApiReady)return Promise.resolve();
 if(window.YT&&window.YT.Player){ytApiReady=true;return Promise.resolve();}
 return new Promise((resolve,reject)=>{
  if(!ytApiLoading){
   ytApiLoading=true;
   const old=window.onYouTubeIframeAPIReady;
   window.onYouTubeIframeAPIReady=()=>{if(typeof old==='function')old();ytApiReady=true;resolve();};
   const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>reject(new Error('Nu s-a putut încărca playerul YouTube.'));document.head.append(s);
  } else {
   const wait=()=>{if(window.YT&&window.YT.Player){ytApiReady=true;resolve();}else setTimeout(wait,150);};wait();
  }
 });
}
function addCard(item,play){
 const card=make('article','item');
 if(item.thumb){const img=document.createElement('img');img.className='thumbimg';img.src=item.thumb;img.alt='';img.loading='lazy';card.append(img);}else card.append(make('div','thumb','▶'));
 const body=make('div','itembody');body.append(make('h3','',item.title),make('p','',item.info||''),make('p','',item.description||''));
 const b=make('button','',item.button||'Redă aici');b.type='button';b.addEventListener('click',play);body.append(b);
 if(item.source){const a=make('a','sourceLink','Sursa');a.href=item.source;a.target='_blank';a.rel='noopener';body.append(a);}
 card.append(body);results.append(card);
}
function addToQueue(entry){
 const index=queue.push(entry)-1;
 addCard(entry,()=>playAt(index));
}
document.getElementById('saveKey').addEventListener('click',()=>{const v=apiInput.value.trim();if(!v){keyStatus.textContent='Introdu cheia mai întâi';return;}localStorage.setItem('gway_youtube_key',v);apiKey=v;keyStatus.textContent='Cheie salvată pe acest telefon';});
document.getElementById('forgetKey').addEventListener('click',()=>{localStorage.removeItem('gway_youtube_key');apiKey='';apiInput.value='';keyStatus.textContent='Cheie ștearsă din acest telefon';});
async function searchYouTube(q){
 if(!apiKey)throw new Error('Pentru căutarea YouTube, introdu cheia API în secțiunea „Conectare YouTube”.');
 const u=new URL('https://www.googleapis.com/youtube/v3/search');u.search=new URLSearchParams({part:'snippet',type:'video',maxResults:'12',q,key:apiKey}).toString();
 const r=await fetch(u),data=await r.json();if(!r.ok)throw new Error(data?.error?.message||`YouTube a răspuns cu ${r.status}`);
 for(const v of data.items||[]){const id=v.id?.videoId;if(!id)continue;const sn=v.snippet||{};
  addToQueue({type:'youtube',id,title:sn.title||'Videoclip YouTube',info:`YouTube · ${sn.channelTitle||''}`,description:sn.description||'',thumb:sn.thumbnails?.medium?.url||sn.thumbnails?.default?.url,button:'Redă în G-Way',source:`https://www.youtube.com/watch?v=${id}`});
 }
 return (data.items||[]).length;
}
async function searchArchive(q){
 const params=new URLSearchParams({q:`(${q}) AND mediatype:(movies OR audio)`,'fl[]':'identifier,title,description,year,mediatype',rows:'12',page:'1',output:'json','sort[]':'downloads desc'});
 const r=await fetch(`https://archive.org/advancedsearch.php?${params}`);if(!r.ok)throw new Error(`Internet Archive: ${r.status}`);
 const data=await r.json(),docs=data?.response?.docs||[];
 for(const item of docs){const desc=Array.isArray(item.description)?item.description[0]:(item.description||'');
  addToQueue({type:'archive',item,title:item.title||item.identifier,info:`Internet Archive · ${item.year||''} · ${item.mediatype||''}`,description:String(desc).slice(0,130),button:'Redă în G-Way',source:`https://archive.org/details/${encodeURIComponent(item.identifier)}`});
 }
 return docs.length;
}
async function playAt(index){
 if(!queue.length)return;
 queueIndex=((index%queue.length)+queue.length)%queue.length;
 const entry=queue[queueIndex];nowPlaying.textContent=entry.title;setStatus(queueLabel());
 if(archiveMedia){archiveMedia.pause();archiveMedia.onended=null;archiveMedia=null;}
 if(entry.type==='youtube'){await playYouTube(entry);return;}
 await playArchive(entry);
}
async function playNext(){if(queue.length)await playAt((queueIndex+1)%queue.length);}
async function playYouTube(entry){
 setStatus('Se pregătește playerul YouTube…');
 try{
  await loadYouTubeAPI();
  playerArea.replaceChildren();const mount=make('div','ytmount');mount.id='gway-youtube-player';playerArea.append(mount);
  if(ytPlayer&&typeof ytPlayer.destroy==='function'){try{ytPlayer.destroy();}catch(e){}}
  ytPlayer=new YT.Player(mount.id,{videoId:entry.id,playerVars:{playsinline:1,rel:0,enablejsapi:1},events:{
   onReady:event=>{event.target.playVideo();setStatus(queueLabel());},
   onStateChange:event=>{if(event.data===YT.PlayerState.ENDED)playNext();},
   onError:()=>setStatus('Acest clip nu permite redarea în player. Alege următorul rezultat.')
  }});
  setStatus(queueLabel());
 }catch(e){setStatus('Player YouTube indisponibil');message.textContent=e.message;}
}
async function playArchive(entry){
 setStatus('Se verifică fișierele…');
 try{
  const item=entry.item,r=await fetch(`https://archive.org/metadata/${encodeURIComponent(item.identifier)}`);
  if(!r.ok)throw new Error('Metadatele nu sunt disponibile.');
  const m=await r.json(),files=(m.files||[]).filter(f=>f.name&&!f.name.includes('_thumb')).map(f=>({...f,ext:(f.name.split('.').pop()||'').toLowerCase()})).filter(f=>['mp3','m4a','ogg','oga','wav','mp4','m4v','webm'].includes(f.ext));
  if(!files.length)throw new Error('Nu există fișier compatibil pentru redare.');
  const rank={mp4:0,mp3:1,m4a:2,webm:3,ogg:4,oga:5,wav:6,m4v:7};files.sort((a,b)=>rank[a.ext]-rank[b.ext]);
  const f=files[0],path=f.name.split('/').map(encodeURIComponent).join('/'),audio=['mp3','m4a','ogg','oga','wav'].includes(f.ext);
  const media=document.createElement(audio?'audio':'video');media.controls=true;media.playsInline=true;media.preload='metadata';media.src=`https://archive.org/download/${encodeURIComponent(item.identifier)}/${path}`;media.className='archiveplayer';
  media.addEventListener('ended',playNext);media.addEventListener('error',()=>setStatus('Fișierul nu poate fi redat. Încearcă următorul rezultat.'));
  archiveMedia=media;playerArea.replaceChildren(media);setStatus(queueLabel());media.play().catch(()=>setStatus('Apasă Play în player. Redarea continuă automat după pornire.'));
 }catch(e){setStatus('Indisponibil');message.textContent=e.message;}
}
async function searchMaterials(term){
 const q=String(term||'').trim();if(!q){message.textContent='Scrie un termen de căutare.';queryInput.focus();return;}
 const thisSearch=++searchSerial;queue=[];queueIndex=-1;if(archiveMedia){archiveMedia.pause();archiveMedia=null;}if(ytPlayer&&ytPlayer.destroy){try{ytPlayer.destroy();}catch(e){}ytPlayer=null;}
 results.replaceChildren();message.textContent='Caut pe YouTube și în Internet Archive…';count.textContent='Se caută…';
 let yt=0,ia=0,errs=[];
 try{yt=await searchYouTube(q);}catch(e){errs.push(e.message);}
 try{ia=await searchArchive(q);}catch(e){errs.push(e.message);}
 if(thisSearch!==searchSerial)return;
 count.textContent=`${yt+ia} rezultate (${yt} YouTube · ${ia} Internet Archive)`;
 if(!yt&&!ia)message.textContent=errs.join(' | ')||'Nu am găsit rezultate. Încearcă alt termen.';
 else message.textContent='Redă un rezultat. La terminare, G-Way trece automat la următorul și reia lista la infinit.';
 if(errs.length)message.textContent+=` Atenție: ${errs.join(' | ')}`;
 setStatus(queueLabel());
}
form.addEventListener('submit',e=>{e.preventDefault();searchMaterials(queryInput.value);});
document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{queryInput.value=b.dataset.q;searchMaterials(b.dataset.q);}));
