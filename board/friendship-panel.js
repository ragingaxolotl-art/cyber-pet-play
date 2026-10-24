import {identity,rankings,restoreFriendships,FRIENDSHIP_SAVE_SECONDS} from './friendships.js?v=height1';
const ENDPOINT='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/board-api/friendships';
const persistable=p=>/^[a-f0-9]{64}$/.test(identity(p))||/^companion-(fern|echo|moss|nova)$/.test(identity(p));
export function installFriendships(getPets){
 const dialog=document.createElement('dialog');dialog.id='friendship-panel';
 dialog.innerHTML=`<button type="button" class="friend-close" aria-label="Close friendships">×</button><span class="eyebrow">CHARACTER FRIENDSHIPS</span><h1>Getting to know each other</h1><p>Conversations, gifts and comfort build friendship. Different preferences and low moods can lead to disagreements; apologies help repair them.</p><p class="small">0–19 Strong disagreement · 20–39 Strained · 40–54 Getting acquainted · 55–69 Friendly · 70–84 Good friends · 85–100 Best friends</p><label>Character <select id="friend-character"></select></label><div id="friend-detail"></div><button type="button" id="friend-download">Download friendship file</button><div class="divider">Teacher saving</div><p class="small">Enable on one classroom board. Every 15 minutes of active play, each character’s three closest and three least-liked peers are saved in its board friendship record. Reloading restores those saved relationships. Neutral peers are never labelled disliked. Original game backup ZIPs stay separate.</p><form id="friend-enable"><label>Teacher password <input id="friend-password" type="password" autocomplete="current-password" required maxlength="256"></label><button>Enable 15-minute saves</button></form><button type="button" id="friend-reload">Reload saved friendships</button><button type="button" id="friend-save" hidden>Save now</button><button type="button" id="friend-stop" hidden>Stop saving</button><p id="friend-status" role="status"></p>`;
 document.body.append(dialog);const $=id=>dialog.querySelector('#'+id),status=$('friend-status');
 let password='',record={revision:0,characters:{}},ready=false,busy=false,seconds=0,retry=0,selected='',lastList='';
 const applied=new WeakSet();
 const describe=()=>{
  const pets=getPets(),list=pets.map(p=>identity(p)+':'+p.data.name).join('|');
  if(list!==lastList){lastList=list;$('friend-character').replaceChildren(...pets.map(p=>{const option=document.createElement('option');option.value=identity(p);option.textContent=p.data.name;return option;}));if(pets.some(p=>identity(p)===selected))$('friend-character').value=selected;}
  const p=pets.find(p=>identity(p)===$('friend-character').value);if(!p)return;
  selected=identity(p);const detail=$('friend-detail');detail.replaceChildren();
  for(const [key,title] of [['closest','Closest friends · closest first'],['leastLiked','Least-liked peers']]){
   const h=document.createElement('h2');h.textContent=title;detail.append(h);
   const rows=rankings(p)[key];if(!rows.length){const empty=document.createElement('p');empty.textContent=key==='closest'?'No close friends yet.':'No strained relationships yet.';detail.append(empty);}
   for(const r of rows){const line=document.createElement('p');line.textContent=`${r.name} · ${r.level} · ${r.score}/100`;const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=r.score;meter.setAttribute('aria-label',r.name+' closeness');line.append(document.createElement('br'),meter);detail.append(line);}
  }
  const time=document.createElement('p');time.className='small';time.textContent=p.friendshipSavedAt?'Last saved: '+new Date(p.friendshipSavedAt).toLocaleString():'Not saved yet';detail.append(time);
 };
 const hydrate=()=>{if(!ready)return;for(const p of getPets())if(!applied.has(p)){restoreFriendships(p,record.characters[identity(p)]);applied.add(p);}};
 async function load(){const res=await fetch(ENDPOINT,{cache:'no-store'});if(!res.ok)throw Error('Saved friendships are unavailable. Try again.');record=await res.json();ready=true;hydrate();}
 async function save(){
  if(busy||!password||!ready)return;busy=true;
  const snapshot=getPets().filter(persistable).map(p=>({id:identity(p),...rankings(p)}));
  // Keep only peers belonging to this class/residents; local ZIP previews remain local.
  const ids=new Set(getPets().filter(persistable).map(identity));
  for(const p of snapshot){p.closest=p.closest.filter(r=>ids.has(r.id));p.leastLiked=p.leastLiked.filter(r=>ids.has(r.id));}
  try{
   const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Teacher-Password':password},body:JSON.stringify({revision:record.revision,characters:snapshot})});const body=await res.json();
   if(!res.ok){if(res.status===401||res.status===409){password='';$('friend-enable').hidden=false;$('friend-save').hidden=$('friend-stop').hidden=true;}throw Error(body.error||'Save failed.');}
   record=body;seconds=0;retry=0;for(const p of getPets()){p.friendshipSavedAt=record.characters[identity(p)]?.updatedAt||null;}status.textContent='Saved. Next update after 15 minutes of active play.';
  }catch(e){seconds=FRIENDSHIP_SAVE_SECONDS;retry=60;status.textContent=e.message+(password?' Retrying in one active minute.':'');}finally{busy=false;if(dialog.open)describe();}
 }
 dialog.querySelector('.friend-close').onclick=()=>dialog.close();
 document.getElementById('friendships').onclick=()=>{hydrate();describe();dialog.showModal();};
 $('friend-character').onchange=describe;
 $('friend-enable').onsubmit=async event=>{
  event.preventDefault();if(busy)return;
  password=$('friend-password').value;$('friend-password').value='';
  try{if(!ready)await load();await save();if(password){$('friend-enable').hidden=true;$('friend-save').hidden=$('friend-stop').hidden=false;}}catch(e){password='';status.textContent=e.message;}
 };
 $('friend-reload').onclick=async()=>{if(busy)return;password='';$('friend-enable').hidden=false;$('friend-save').hidden=$('friend-stop').hidden=true;try{await load();for(const p of getPets())restoreFriendships(p,record.characters[identity(p)]||{closest:[],leastLiked:[]});seconds=0;describe();status.textContent='Saved friendships restored. Enable saving to continue.';}catch(e){status.textContent=e.message;}};
 $('friend-save').onclick=save;
 $('friend-stop').onclick=()=>{password='';$('friend-enable').hidden=false;$('friend-save').hidden=$('friend-stop').hidden=true;status.textContent='Automatic saving stopped.';};
 $('friend-download').onclick=()=>{const p=getPets().find(p=>identity(p)===selected);if(!p)return;const file={schema:1,character:identity(p),name:p.data.name,bestFriend:rankings(p).closest[0]||null,...rankings(p),savedAt:p.friendshipSavedAt||null,exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='character-friendships.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 load().catch(e=>{status.textContent=e.message;});
 let displayTimer=0;
 return {tick(dt){hydrate();seconds+=password?dt:0;retry=Math.max(0,retry-dt);displayTimer+=dt;if(dialog.open&&displayTimer>=1){displayTimer=0;describe();}if(seconds>=FRIENDSHIP_SAVE_SECONDS&&retry===0)void save();},hydrate};
}
